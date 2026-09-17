import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase()
    const { id } = await params

    const result = await db.execute({
      sql: 'SELECT * FROM attachments WHERE id = ? LIMIT 1',
      args: [id],
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    const row: any = result.rows[0]
    const filename: string = row.filename || 'downloaded-file'
    const fileUrl: string = row.file_url
    const fileType: string = row.file_type || 'application/octet-stream'

    const storedFileName = path.basename(fileUrl)
    const filePath = path.join(process.cwd(), 'public', 'uploads', storedFileName)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on server disk' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)

    // Return response with Content-Disposition attachment and filename
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
