'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  Database,
  Shield,
  Network,
  Cpu,
  Layers,
  FileCode,
  Clock,
  Eye,
  Copy,
  Check,
  X,
  Plus,
  Bookmark,
  Share2,
  Terminal,
} from 'lucide-react'
import { EmptyState } from '@/components/nexus/empty-state'
import { useToast } from '@/components/nexus/toast-provider'

export interface Article {
  id: string
  title: string
  category: 'Database' | 'Security' | 'Networking' | 'Kubernetes' | 'AI Automation'
  summary: string
  tags: string[]
  reads: string
  lastUpdated: string
  author: {
    name: string
    initials: string
    role: string
  }
  steps: {
    title: string
    description: string
    command?: string
  }[]
}

import { useNexusData } from '@/lib/data-context'

export default function KnowledgeBasePage() {
  const { runbooks, loading, createRunbook } = useNexusData()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Database' | 'Security' | 'Networking' | 'Kubernetes' | 'AI Automation'>('All')
  const [activeArticle, setActiveArticle] = useState<any | null>(null)
  const [copiedCommandIndex, setCopiedCommandIndex] = useState<number | null>(null)
  const [newArticleModal, setNewArticleModal] = useState(false)
  const articles = runbooks

  const { success, info } = useToast()

  const categories = ['All', 'Database', 'Security', 'Networking', 'Kubernetes', 'AI Automation'] as const

  const filteredArticles = articles.filter((art) => {
    if (selectedCategory !== 'All' && art.category !== selectedCategory) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      art.title.toLowerCase().includes(q) ||
      art.id.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  const copyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd)
    setCopiedCommandIndex(index)
    setTimeout(() => setCopiedCommandIndex(null), 2000)
    success('Command Copied', 'CLI snippet copied to your clipboard.')
  }

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400 font-semibold flex items-center gap-1.5">
              <BookOpen className="size-3 text-violet-500" />
              Verified Runbooks & SOPs
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              v2.40 · Enterprise Knowledge Mesh
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Operational Knowledge Base
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Standard Operating Procedures, incident recovery playbooks, and verified root-cause remediation runbooks.
          </p>
        </div>

        <button
          onClick={() => {
            setNewArticleModal(true)
          }}
          className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md"
        >
          <Plus className="size-4" />
          <span>New Runbook Article</span>
        </button>
      </div>

      {/* 2. Search Bar & Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition select-none shrink-0 ${
                  isSelected
                    ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/40 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runbooks, tags, commands..."
            className="w-full rounded-xl border border-border bg-card/80 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* 3. Card-Based Layout Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredArticles.map((article) => {
              const categoryTone =
                article.category === 'Database'
                  ? 'text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                  : article.category === 'Security'
                  ? 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10'
                  : article.category === 'AI Automation'
                  ? 'text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-500/10'
                  : 'text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10'

              return (
                <motion.div
                  key={article.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setActiveArticle(article)}
                  className="nexus-glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-xl transition-all duration-200 cursor-pointer group relative overflow-hidden"
                >
                  <div>
                    {/* Top Row: ID, Category & Last Updated */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          #{article.id}
                        </span>
                        <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border font-semibold ${categoryTone}`}>
                          {article.category}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {article.lastUpdated}
                      </span>
                    </div>

                    {/* Article Title */}
                    <h3 className="mt-3 text-sm sm:text-base font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>

                    {/* Summary Snippet */}
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground border border-border/50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-secondary border border-border flex items-center justify-center font-mono text-[9px] font-bold text-foreground">
                        {article.author.initials}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {article.reads} views
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Runbook</span>
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          badgeTone="violet"
          badgeText="KNOWLEDGE BASE: 0 RESULTS"
          title="No Matching Runbook Articles"
          description="We couldn't find any articles matching your search query or selected category filter."
          action={{
            label: 'Reset Search & Filter',
            onClick: () => {
              setSearchQuery('')
              setSelectedCategory('All')
            },
          }}
        />
      )}

      {/* 4. Interactive Runbook Reader Modal */}
      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveArticle(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-popover/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl z-10 select-none text-foreground max-h-[90vh] flex flex-col"
            >
              {/* Reader Header */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      #{activeArticle.id}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-border bg-secondary font-semibold text-muted-foreground">
                      {activeArticle.category}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      Updated {activeArticle.lastUpdated} by {activeArticle.author.name}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                    {activeArticle.title}
                  </h2>
                </div>

                <button
                  onClick={() => setActiveArticle(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Reader Body */}
              <div className="mt-4 space-y-6 overflow-y-auto pr-1">
                {/* Summary */}
                <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground">Operational Scope: </span>
                  {activeArticle.summary}
                </div>

                {/* Steps sequence */}
                <div className="space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                    <Terminal className="size-3.5 text-cyan-500" />
                    Standard Execution Sequence
                  </h3>

                  {activeArticle.steps?.map((step: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-border/80 bg-secondary/30 space-y-2"
                    >
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        {step.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>

                      {step.command && (
                        <div className="relative mt-2">
                          <pre className="p-3 rounded-lg border border-border bg-black/50 font-mono text-[11px] text-cyan-400 overflow-x-auto">
                            {step.command}
                          </pre>
                          <button
                            onClick={() => copyCommand(step.command!, idx)}
                            className="absolute right-2 top-2 p-1 rounded bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition text-[10px] flex items-center gap-1"
                            title="Copy Command"
                          >
                            {copiedCommandIndex === idx ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
                <button
                  onClick={() => {
                    success('Runbook Link Shared', `Copied link to Runbook #${activeArticle.id}`)
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  <Share2 className="size-3.5" />
                  <span>Share Runbook</span>
                </button>

                <button
                  onClick={() => setActiveArticle(null)}
                  className="rounded-xl border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
                >
                  Close Reader
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. New Article Modal */}
      <AnimatePresence>
        {newArticleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNewArticleModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-popover/95 p-6 shadow-2xl backdrop-blur-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground">Create Knowledge Base Runbook</h3>
                <button onClick={() => setNewArticleModal(false)}>
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Runbook Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Edge CDN Anycast Cache Invalidation"
                    className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-foreground outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Category</label>
                  <select className="w-full rounded-xl border border-border bg-secondary/60 px-2.5 py-2 text-foreground outline-none focus:border-cyan-500">
                    <option>Database</option>
                    <option>Security</option>
                    <option>Networking</option>
                    <option>Kubernetes</option>
                    <option>AI Automation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Summary & Objectives</label>
                  <textarea
                    rows={3}
                    placeholder="Scope, prerequisites, and operational impact..."
                    className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-foreground outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setNewArticleModal(false)}
                  className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setNewArticleModal(false)
                    success('Runbook Draft Created', 'Runbook published to internal engineering catalog.')
                  }}
                  className="quantum-gradient-btn rounded-xl px-4 py-2 text-xs font-bold"
                >
                  Publish Runbook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
