import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import path from 'path'
import fs from 'fs'

export async function POST(request: Request) {
  try {
    await initDatabase()
    const formData = await request.formData()

    const incidentId = (formData.get('incidentId') as string) || ''
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Operador TI'

    // Get all files from formData
    const files = formData.getAll('files') as File[]
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const createdAttachments = []

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function') continue

      const originalName = file.name || 'unnamed-file'
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const ext = path.extname(sanitizedName)
      const baseName = path.basename(sanitizedName, ext)
      const uniqueId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const storedFileName = `${uniqueId}-${baseName}${ext}`
      const filePath = path.join(uploadDir, storedFileName)

      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(filePath, buffer)

      const fileUrl = `/uploads/${storedFileName}`
      const fileSize = buffer.length
      const fileType = file.type || 'application/octet-stream'
      const createdAt = new Date().toISOString()

      // Insert into SQLite
      await db.execute({
        sql: `INSERT INTO attachments (id, incident_id, filename, file_size, file_type, file_url, uploaded_by, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [uniqueId, incidentId, originalName, fileSize, fileType, fileUrl, uploadedBy, createdAt],
      })

      const attachmentObj = {
        id: uniqueId,
        incidentId,
        filename: originalName,
        fileSize,
        fileType,
        fileUrl,
        uploadedBy,
        createdAt,
      }

      createdAttachments.push(attachmentObj)

      // If incidentId is specified, update incident attachments_json and timeline
      if (incidentId && incidentId !== 'draft') {
        const cleanId = incidentId.startsWith('#') ? incidentId : `#${incidentId}`
        const rawId = cleanId.replace('#', '')

        const incRes = await db.execute({
          sql: 'SELECT attachments_json, timeline_json FROM incidents WHERE id = ? OR id = ? LIMIT 1',
          args: [cleanId, rawId],
        })

        if (incRes.rows.length > 0) {
          const row: any = incRes.rows[0]
          const existingList = row.attachments_json ? JSON.parse(row.attachments_json) : []
          const updatedList = [...existingList, attachmentObj]

          await db.execute({
            sql: 'UPDATE incidents SET attachments_json = ? WHERE id = ? OR id = ?',
            args: [JSON.stringify(updatedList), cleanId, rawId],
          })
        }
      }
    }

    return NextResponse.json({ success: true, attachments: createdAttachments }, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading attachments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    await initDatabase()
    const { searchParams } = new URL(request.url)
    const incidentId = searchParams.get('incidentId')

    if (!incidentId) {
      const result = await db.execute('SELECT * FROM attachments ORDER BY rowid DESC LIMIT 100')
      const attachments = result.rows.map((row: any) => ({
        id: row.id,
        incidentId: row.incident_id,
        filename: row.filename,
        fileSize: Number(row.file_size),
        fileType: row.file_type,
        fileUrl: row.file_url,
        uploadedBy: row.uploaded_by,
        createdAt: row.created_at,
      }))
      return NextResponse.json(attachments)
    }

    const cleanId = incidentId.startsWith('#') ? incidentId : `#${incidentId}`
    const rawId = cleanId.replace('#', '')

    const result = await db.execute({
      sql: 'SELECT * FROM attachments WHERE incident_id = ? OR incident_id = ? ORDER BY rowid ASC',
      args: [cleanId, rawId],
    })

    const attachments = result.rows.map((row: any) => ({
      id: row.id,
      incidentId: row.incident_id,
      filename: row.filename,
      fileSize: Number(row.file_size),
      fileType: row.file_type,
      fileUrl: row.file_url,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
    }))

    return NextResponse.json(attachments)
  } catch (error: any) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await initDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing attachment id' }, { status: 400 })
    }

    const result = await db.execute({
      sql: 'SELECT * FROM attachments WHERE id = ? LIMIT 1',
      args: [id],
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    const row: any = result.rows[0]
    const fileUrl: string = row.file_url
    const incidentId: string = row.incident_id

    // Remove file from disk
    if (fileUrl) {
      const storedFileName = path.basename(fileUrl)
      const filePath = path.join(process.cwd(), 'public', 'uploads', storedFileName)
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
        } catch (e) {
          console.warn('Could not delete physical file:', e)
        }
      }
    }

    // Delete from attachments table
    await db.execute({
      sql: 'DELETE FROM attachments WHERE id = ?',
      args: [id],
    })

    // Update incident attachments_json if exists
    if (incidentId) {
      const cleanId = incidentId.startsWith('#') ? incidentId : `#${incidentId}`
      const rawId = cleanId.replace('#', '')

      const incRes = await db.execute({
        sql: 'SELECT attachments_json FROM incidents WHERE id = ? OR id = ? LIMIT 1',
        args: [cleanId, rawId],
      })

      if (incRes.rows.length > 0 && incRes.rows[0].attachments_json) {
        const list = JSON.parse(incRes.rows[0].attachments_json as string)
        const updated = list.filter((a: any) => a.id !== id)
        await db.execute({
          sql: 'UPDATE incidents SET attachments_json = ? WHERE id = ? OR id = ?',
          args: [JSON.stringify(updated), cleanId, rawId],
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
