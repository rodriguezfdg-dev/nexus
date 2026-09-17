export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'
export type IncidentStatus = 'Open' | 'In Progress' | 'Blocked' | 'Resolved'
export type ServiceTag = 
  | 'Postgres-Cluster' 
  | 'Auth-Gateway' 
  | 'Kafka-Pipeline' 
  | 'Kubernetes-Mesh' 
  | 'Redis-Cache' 
  | 'Edge-CDN' 
  | 'Billing-API'
  | 'DNS-Mesh'

export interface TimelineEvent {
  id: string
  type: 'internal_note' | 'customer_reply' | 'system_event'
  author: {
    name: string
    role: string
    initials: string
    avatarColor?: string
    isCustomer?: boolean
  }
  timestamp: string
  content: string
  metadata?: {
    logLevel?: 'INFO' | 'WARN' | 'ERROR' | 'CRIT'
    latency?: string
    source?: string
  }
}

export interface MacroTemplate {
  id: string
  title: string
  description: string
  content: string
  type: 'internal' | 'customer'
}

export interface TicketAttachment {
  id: string
  incidentId: string
  filename: string
  fileSize: number
  fileType: string
  fileUrl: string
  uploadedBy: string
  createdAt: string
}

export interface IncidentDetail {
  id: string
  title: string
  priority: Priority
  status: IncidentStatus
  service: ServiceTag
  env: 'Production' | 'Staging' | 'Edge'
  assignee: {
    name: string
    initials: string
    status: 'online' | 'busy' | 'ai'
  }
  reporter: {
    name: string
    email: string
    organization: string
  }
  slaSecondsTotal: number
  slaSecondsRemaining: number
  aiTriaged: boolean
  assignedToMe: boolean
  tag: string
  createdTime: string
  attachments?: TicketAttachment[]
  
  // AI Copilot Data
  aiCopilot: {
    summary: string
    rca: {
      diagnosis: string
      confidencePercent: number
      affectedComponent: string
      remediationSteps: string[]
    }
    resolutionSteps: string[]
  }

  // Timeline
  timeline: TimelineEvent[]
}

export const macroTemplates: MacroTemplate[] = [
  {
    id: 'pg-failover',
    title: 'PostgreSQL Read-Replica Failover Notice',
    description: 'Acknowledge replication stall and execute failover to hot standby.',
    type: 'internal',
    content: 'EXECUTION PLAN: Initiating automated failover from patroni-cluster-0 to replica-02 hot standby. Connection pool draining engaged. Monitoring WAL replay rate.',
  },
  {
    id: 'customer-ack',
    title: 'Customer Incident Acknowledged (P1 SLA)',
    description: 'Official acknowledgement sent to impacted enterprise tenant.',
    type: 'customer',
    content: 'Thank you for your report. Our Site Reliability Engineering (SRE) and Quantum Triage systems have isolated the latency degradation. We have escalated this to Tier-3 incident status with active remediation underway. Expected resolution window is under 15 minutes.',
  },
  {
    id: 'tier3-escalate',
    title: 'Escalate to Tier-3 Database Core',
    description: 'Internal paging message for on-call principal architect.',
    type: 'internal',
    content: 'ESCALATION TICKET: Requesting immediate join by @database-leads. Unbounded analytical queries saturating replica write buffers. Lock contention graph attached in telemetry.',
  },
  {
    id: 'customer-resolved',
    title: 'Customer Resolution Notification',
    description: 'Notice confirming service restoration and SLO recovery.',
    type: 'customer',
    content: 'We are pleased to inform you that the anomalous latency spike affecting your cluster has been mitigated. Replication lag has normalized to < 18ms and all synthetic health probes are green. A comprehensive Post-Incident Review (PIR) will follow within 24 business hours.',
  },
]

export const mockIncidentsData: Record<string, IncidentDetail> = {
  'NX-8942': {
    id: '#NX-8942',
    title: 'PostgreSQL Primary Cluster Replication Lag Escalating (>4.2s)',
    priority: 'Critical',
    status: 'In Progress',
    service: 'Postgres-Cluster',
    env: 'Production',
    assignee: { name: 'Alex Thorne', initials: 'AT', status: 'busy' },
    reporter: { name: 'Elena Rostova', email: 'e.rostova@enterprise-fin.io', organization: 'Apex Global Financial' },
    slaSecondsTotal: 1800, // 30m
    slaSecondsRemaining: 764, // ~12m 44s
    aiTriaged: false,
    assignedToMe: true,
    tag: 'Database',
    createdTime: '8m ago',
    aiCopilot: {
      summary: 'Quantum Triage identified an asymmetric I/O saturation on replica-02 caused by an unindexed OLAP aggregate query executing across partitioned transaction ledgers. WAL replay latency surged from 28ms baseline to 4,219ms.',
      rca: {
        diagnosis: 'WAL sender process thread lock contention on patroni-node-02 triggered by concurrent write surges and analytical lock starvation.',
        confidencePercent: 94,
        affectedComponent: 'PostgreSQL 16.2 Patroni Master-Replica Bus',
        remediationSteps: [
          'Drain connection pool for analytical reader workloads',
          'Flush locked replication slot on replica-02',
          'Promote standby replica-03 or rebalance read queries to read-pool-east',
          'Apply temporary query rate-limiter on ad-hoc reporting credentials',
        ],
      },
      resolutionSteps: [
        'Analyzing PostgreSQL WAL replication lag and replica-02 state...',
        'Running diagnostic check on consumer buffer pool...',
        'Re-allocating read-replica connections & terminating blocking queries...',
        'Flushing replication slot & validating replication lag < 100ms...',
      ],
    },
    timeline: [
      {
        id: 'evt-1',
        type: 'system_event',
        author: { name: 'Nexus Monitor Daemon', role: 'Telemetry Core', initials: 'SY' },
        timestamp: '8m ago',
        content: 'ALERT TRIGGERED: postgresql.replication_lag_seconds > 4.0s (measured: 4.219s) on host db-prod-primary.us-east.internal. Severity elevated to P1 Critical.',
        metadata: { logLevel: 'CRIT', latency: '4219ms', source: 'Prometheus-Core-01' },
      },
      {
        id: 'evt-2',
        type: 'customer_reply',
        author: { name: 'Elena Rostova', role: 'VP Infrastructure @ Apex Global', initials: 'ER', isCustomer: true },
        timestamp: '6m ago',
        content: 'We are observing severe latency degradation on our institutional checkout and settlement APIs. Transaction failure rate spiked by 3.8%. Need immediate confirmation of investigation.',
      },
      {
        id: 'evt-3',
        type: 'system_event',
        author: { name: 'Quantum AI Agent', role: 'Autonomous SRE', initials: 'AI' },
        timestamp: '5m ago',
        content: 'Autonomous RCA generated with 94% confidence: Lock contention on replica-02 WAL receiver. Recommending failover or reader pool isolation.',
        metadata: { logLevel: 'WARN', source: 'Nexus-Quantum-Copilot' },
      },
      {
        id: 'evt-4',
        type: 'internal_note',
        author: { name: 'Alex Thorne', role: 'Staff SRE (Assignee)', initials: 'AT' },
        timestamp: '3m ago',
        content: 'Investigating query locks via pg_stat_activity. Saturated query identified: SELECT * FROM ledger_transactions WHERE tenant_id = 89912. Preparing to isolate connection pool.',
      },
    ],
  },
  'NX-9428': {
    id: '#NX-9428',
    title: 'Kafka Consumer Group Consumer Offset Stall on Event Bus',
    priority: 'Critical',
    status: 'Open',
    service: 'Kafka-Pipeline',
    env: 'Production',
    assignee: { name: 'SecOps On-Call', initials: 'SO', status: 'online' },
    reporter: { name: 'Marcus Vance', email: 'm.vance@datapipelines.io', organization: 'CloudStream Ops' },
    slaSecondsTotal: 1800,
    slaSecondsRemaining: 840,
    aiTriaged: true,
    assignedToMe: false,
    tag: 'Streaming',
    createdTime: '12m ago',
    aiCopilot: {
      summary: 'Kafka partition rebalance deadlock observed across consumer group "event-processor-prod". Offset lag exceeded 850,000 messages on topic payment.events.v1.',
      rca: {
        diagnosis: 'Heartbeat timeout exceeded due to heavy garbage collection pause (>12s) on worker node kfk-worker-08.',
        confidencePercent: 91,
        affectedComponent: 'Apache Kafka 3.6 / Consumer Cluster A',
        remediationSteps: [
          'Restart stalled consumer pod worker-08',
          'Tune max.poll.interval.ms and session.timeout.ms',
          'Resume consumer commit offset from safe checkpoint',
        ],
      },
      resolutionSteps: [
        'Inspecting Kafka broker partition coordinator...',
        'Checking consumer heartbeat metrics on kfk-worker-08...',
        'Triggering graceful restart of deadlocked consumer pod...',
        'Verifying offset catch-up rate and consumer lag recovery...',
      ],
    },
    timeline: [
      {
        id: 'evt-101',
        type: 'system_event',
        author: { name: 'Kafka Metrics Agent', role: 'Streaming Monitor', initials: 'KM' },
        timestamp: '12m ago',
        content: 'WARN: Consumer group "event-processor-prod" lag > 500,000 on topic payment.events.v1.',
        metadata: { logLevel: 'WARN', source: 'Kafka-Ex-02' },
      },
      {
        id: 'evt-102',
        type: 'internal_note',
        author: { name: 'SecOps On-Call', role: 'Incident Commander', initials: 'SO' },
        timestamp: '9m ago',
        content: 'Worker 08 entered prolonged GC pause. We are evaluating pod restart vs consumer partition reassignment.',
      },
    ],
  },
  'NX-9104': {
    id: '#NX-9104',
    title: 'Auth0 SAML OAuth Token Verification Handshake Latency Spike',
    priority: 'High',
    status: 'In Progress',
    service: 'Auth-Gateway',
    env: 'Production',
    assignee: { name: 'Alex Thorne', initials: 'AT', status: 'busy' },
    reporter: { name: 'Sarah Chen', email: 's.chen@fintech-identity.com', organization: 'Fintech ID Corp' },
    slaSecondsTotal: 3600,
    slaSecondsRemaining: 1420,
    aiTriaged: true,
    assignedToMe: true,
    tag: 'Security',
    createdTime: '22m ago',
    aiCopilot: {
      summary: 'Upstream identity provider key verification endpoint experiencing intermittent 504 timeouts. In-memory JWKS cache expiration triggered synchronous remote key fetches on every inbound JWT.',
      rca: {
        diagnosis: 'JWKS public key cache TTL misconfiguration led to unthrottled upstream HTTP calls to identity provider.',
        confidencePercent: 96,
        affectedComponent: 'Kong API Gateway & Auth-Service JWKS Cache',
        remediationSteps: [
          'Pre-warm JWKS public certificate cache',
          'Extend cache TTL to 24 hours with stale-while-revalidate',
          'Enable local fallback signing verification',
        ],
      },
      resolutionSteps: [
        'Inspecting JWKS cache hit/miss ratio in Kong...',
        'Re-populating cached signing keys from Auth0 tenant...',
        'Deploying temporary rate-limit bypass for internal auth tokens...',
        'Confirming 99th percentile auth latency drops below 45ms...',
      ],
    },
    timeline: [
      {
        id: 'evt-201',
        type: 'system_event',
        author: { name: 'API Gateway Probe', role: 'Security Edge', initials: 'GW' },
        timestamp: '22m ago',
        content: 'HTTP 504 count exceeded threshold on /oauth/token/verify. Handshake p99 reached 1,840ms.',
        metadata: { logLevel: 'ERROR', latency: '1840ms', source: 'Kong-Proxy' },
      },
    ],
  },
}

// Fallback generator for unknown or arbitrary ticket IDs
export function getIncidentById(rawId: string): IncidentDetail {
  const cleanId = rawId.replace('#', '').toUpperCase()
  
  if (mockIncidentsData[cleanId]) {
    return mockIncidentsData[cleanId]
  }

  // Realistic fallback generated deterministically
  return {
    id: `#${cleanId}`,
    title: `Diagnostic Telemetry & SLO Breach Investigation for #${cleanId}`,
    priority: cleanId.includes('CRIT') || cleanId.includes('P1') ? 'Critical' : 'High',
    status: 'Open',
    service: 'Kubernetes-Mesh',
    env: 'Production',
    assignee: { name: 'Alex Thorne', initials: 'AT', status: 'online' },
    reporter: { name: 'DevOps On-Call', email: 'devops-triage@nexusdesk.internal', organization: 'Infrastructure Core' },
    slaSecondsTotal: 1800,
    slaSecondsRemaining: 1120,
    aiTriaged: true,
    assignedToMe: true,
    tag: 'Infrastructure',
    createdTime: '15m ago',
    aiCopilot: {
      summary: `Nexus Quantum Engine automatically ingested log streams and metrics for ticket #${cleanId}. Telemetry indicates elevated thread utilization and latency jitter.`,
      rca: {
        diagnosis: `Transient network packet drops and connection queue saturation observed on service ingress pod.`,
        confidencePercent: 88,
        affectedComponent: `Cluster Node Mesh (${cleanId})`,
        remediationSteps: [
          'Check host memory and kernel dmesg logs',
          'Recycle stale worker pod connections',
          'Rebalance load balancer target groups',
        ],
      },
      resolutionSteps: [
        `Analyzing cluster metrics for #${cleanId}...`,
        'Running diagnostic suite across worker nodes...',
        'Applying circuit breaker & resetting network buffers...',
        'Validating health probes and error rate normalization...',
      ],
    },
    timeline: [
      {
        id: `evt-${cleanId}-1`,
        type: 'system_event',
        author: { name: 'Nexus Auto-Ingest', role: 'System Daemon', initials: 'NX' },
        timestamp: '15m ago',
        content: `Incident #${cleanId} registered via automated telemetry gateway.`,
        metadata: { logLevel: 'INFO', source: 'Nexus-Ingest-Core' },
      },
      {
        id: `evt-${cleanId}-2`,
        type: 'internal_note',
        author: { name: 'Alex Thorne', role: 'Staff SRE', initials: 'AT' },
        timestamp: '10m ago',
        content: 'Acknowledged ticket. Running diagnostic suite and monitoring error budgets.',
      },
    ],
  }
}
