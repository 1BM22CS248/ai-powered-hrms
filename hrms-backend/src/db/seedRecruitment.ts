import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { db } from './client'
import { jobPostings, candidates, tickets } from './schema'
import type { NewJobPosting, NewCandidate } from './schema/recruitment'
import type { NewTicket } from './schema/tickets'

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _seed = 7
function rand(): number {
  _seed = (_seed * 1664525 + 1013904223) & 0x7fffffff
  return _seed / 0x7fffffff
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// ─── Job Data ─────────────────────────────────────────────────────────────────

const JOB_TITLES = [
  'Software Engineer', 'Senior Engineer', 'Product Manager', 'UX Designer',
  'Data Analyst', 'HR Executive', 'Sales Executive', 'Marketing Manager',
  'DevOps Engineer', 'QA Engineer',
]

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Human Resources',
  'Finance', 'Sales', 'Marketing', 'Operations',
]

const LOCATIONS = [
  'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune',
  'Chennai', 'Kolkata', 'Noida', 'Gurgaon', 'Remote',
]

const JOB_DESCRIPTIONS: Record<string, string> = {
  'Software Engineer': `We are looking for a talented Software Engineer to join our growing engineering team. You will design, build, and maintain scalable backend and frontend services that power our core product.

Responsibilities:
• Design and implement new features using TypeScript, React, and Node.js
• Collaborate with product managers and designers to deliver high-quality experiences
• Write clean, well-tested code and participate actively in code reviews
• Identify and resolve performance bottlenecks and reliability issues

Requirements:
• 2+ years of professional software development experience
• Proficiency in JavaScript/TypeScript and a modern frontend framework (React preferred)
• Experience with RESTful APIs and relational databases (PostgreSQL preferred)
• Familiarity with cloud services (AWS or GCP) and containerization (Docker)`,

  'Senior Engineer': `We are looking for a Senior Engineer to lead technical initiatives and mentor our engineering team. You will play a key role in shaping system architecture and ensuring engineering excellence.

Responsibilities:
• Lead the design and implementation of complex distributed systems
• Conduct code reviews and establish engineering standards and best practices
• Mentor junior and mid-level engineers through pairing and technical guidance
• Collaborate with product and leadership to define technical roadmaps

Requirements:
• 6+ years of professional software engineering experience
• Proven experience with system design, distributed systems, and high-traffic applications
• Strong knowledge of at least one major cloud provider (AWS, GCP, or Azure)
• Experience leading architectural decisions`,

  'Product Manager': `We are hiring an experienced Product Manager to lead strategy and execution for one of our core product lines. You will work at the intersection of business, technology, and design.

Responsibilities:
• Define and own the product roadmap aligned with company strategy and customer needs
• Conduct user research, competitive analysis, and data analysis to identify opportunities
• Write PRDs, user stories, and acceptance criteria for engineering teams
• Partner with engineering, design, marketing, and sales to deliver successful launches

Requirements:
• 3+ years of product management experience in a technology company
• Strong analytical mindset with hands-on experience with product analytics tools
• Excellent written and verbal communication skills
• Experience with Agile development methodologies`,

  'UX Designer': `We are looking for a UX Designer to create intuitive and beautiful product experiences. You will own the design process from research and wireframing through to final delivery.

Responsibilities:
• Conduct user research including interviews, usability tests, and surveys
• Create wireframes, user flows, prototypes, and high-fidelity designs
• Maintain and evolve the product design system
• Partner closely with product managers and engineers throughout the build process

Requirements:
• 2+ years of UX or product design experience
• Strong portfolio demonstrating problem-solving and design thinking
• Proficiency in Figma and prototyping tools
• Experience conducting user research and translating insights into design decisions`,

  'Data Analyst': `We are looking for a Data Analyst to turn complex data into insights that drive business decisions. You will work closely with product, marketing, and operations teams.

Responsibilities:
• Design and build dashboards and reports for business stakeholders
• Conduct exploratory data analysis to surface trends and opportunities
• Design and analyze A/B experiments with product teams
• Automate recurring reports and build data pipelines to support analytics workflows

Requirements:
• 2+ years of experience in a data analyst or related role
• Strong proficiency in SQL and at least one BI tool (Tableau, Power BI, or Looker)
• Experience with Python or R for data analysis
• Ability to communicate data findings clearly to non-technical audiences`,

  'HR Executive': `We are seeking an enthusiastic HR Executive to support our Human Resources team. This is an excellent opportunity to grow your HR career in a dynamic, fast-growing organization.

Responsibilities:
• Manage end-to-end recruitment for junior to mid-level roles
• Coordinate new employee onboarding and induction programs
• Maintain and update employee records in the HRMS with accuracy
• Support monthly payroll inputs and leave management
• Handle employee queries related to HR policies, benefits, and procedures

Requirements:
• 1-3 years of experience in an HR role
• MBA in HR or equivalent degree preferred
• Familiarity with HRMS tools (Darwinbox, Zoho People, or SAP SuccessFactors)
• Strong interpersonal and communication skills`,

  'Sales Executive': `We are looking for a driven Sales Executive to grow our customer base and exceed revenue targets. This is a high-impact role with significant career growth potential.

Responsibilities:
• Prospect, qualify, and close new business opportunities across assigned territory
• Manage the full sales cycle from first contact through contract close
• Build and maintain a healthy sales pipeline in the CRM at all times
• Work with the SDR team to optimize prospecting sequences and messaging

Requirements:
• 3+ years of B2B sales experience, preferably in SaaS
• Track record of consistently meeting or exceeding sales targets
• Strong communication, negotiation, and relationship-building skills
• Proficiency with CRM tools such as Salesforce or HubSpot`,

  'Marketing Manager': `We are hiring a Marketing Manager to lead our marketing function and drive brand awareness and pipeline growth. You will manage a small team and work across digital and offline channels.

Responsibilities:
• Own and execute the marketing roadmap across content, paid, SEO, events, and email
• Manage the marketing budget and track ROI across all channels
• Collaborate with sales on account-based marketing campaigns and lead generation
• Lead go-to-market planning and execution for new product launches

Requirements:
• 5+ years of marketing experience with at least 2 years in a leadership role
• Demonstrated success driving growth through digital channels
• Strong data-driven mindset with experience using analytics tools
• Excellent project management and communication skills`,

  'DevOps Engineer': `We are looking for a DevOps Engineer to build and maintain our cloud infrastructure and deployment pipelines. You will work closely with engineering teams to improve reliability and velocity.

Responsibilities:
• Design, build, and maintain CI/CD pipelines and deployment automation
• Manage cloud infrastructure on AWS using Infrastructure as Code (Terraform)
• Build and operate the observability stack (metrics, logs, alerting)
• Drive reliability engineering initiatives including SLOs and incident response

Requirements:
• 3+ years of DevOps or platform engineering experience
• Strong experience with AWS and Kubernetes
• Proficiency with CI/CD tools such as GitHub Actions or Jenkins
• Experience with Terraform or similar IaC tools`,

  'QA Engineer': `We are looking for a QA Engineer to ensure the quality and reliability of our product across web and mobile platforms. You will design and maintain both manual and automated test strategies.

Responsibilities:
• Design, implement, and maintain automated end-to-end test suites using Playwright or Cypress
• Define quality standards and contribute to definition of done criteria in sprint planning
• Conduct API testing and performance testing for new features and integrations
• Report, triage, and track defects through to resolution

Requirements:
• 2+ years of QA experience with exposure to manual and automated testing
• Hands-on experience with a test automation framework (Playwright, Cypress, or Selenium)
• Proficiency with API testing tools such as Postman or REST Assured
• Strong understanding of Agile/Scrum development processes`,
}

// ─── Resume Templates ─────────────────────────────────────────────────────────

const RESUME_TEMPLATES: Record<string, string[]> = {
  'Software Engineer': [
    `Professional Summary
Results-driven Software Engineer with 3+ years of experience building scalable web applications. Proficient in JavaScript, TypeScript, React, and Node.js. Strong foundation in data structures, algorithms, and system design.

Work Experience
Software Engineer — TechNova Solutions, Bangalore (2023 – Present)
• Developed and maintained REST APIs using Node.js and Express, reducing response latency by 30%
• Built reusable React components that reduced frontend development time by 25%
• Collaborated with cross-functional teams to deliver 4 product releases on schedule
• Implemented automated unit and integration tests achieving 85% code coverage

Junior Developer — CodeCraft Pvt Ltd, Hyderabad (2021 – 2023)
• Assisted in migrating legacy codebase to a modern Node.js microservices architecture
• Developed internal dashboards using React for operations teams
• Participated in daily standups and sprint reviews

Skills
Languages: JavaScript, TypeScript, Python, SQL
Frameworks: React, Node.js, Express, Next.js
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, Docker, AWS (EC2, S3, Lambda), JIRA

Education
B.Tech in Computer Science — VIT University, 2021 | CGPA: 8.4 / 10`,

    `Professional Summary
Creative and detail-oriented Software Engineer with 4 years of experience across full-stack development and cloud infrastructure. Passionate about developer experience and building tools that improve team productivity.

Work Experience
Full Stack Engineer — Zephyr Technologies, Mumbai (2022 – Present)
• Architected a multi-tenant SaaS platform serving 10,000+ active users using React, GraphQL, and AWS
• Led migration from monolithic architecture to microservices, improving deployment frequency by 60%
• Mentored 2 junior engineers and conducted code reviews for the team
• Reduced CI/CD pipeline build time from 18 minutes to 6 minutes through caching

Software Developer — Infobyte Systems, Pune (2020 – 2022)
• Developed customer-facing e-commerce features using Angular and Java Spring Boot
• Integrated third-party payment gateways with proper error handling and retry logic
• Maintained 99.5% uptime for production services through proactive monitoring

Skills
Languages: JavaScript, TypeScript, Java, Go
Frontend: React, Angular, Next.js, Tailwind CSS
Backend: Node.js, Spring Boot, GraphQL, REST
Cloud & DevOps: AWS, GCP, Docker, Kubernetes, Terraform

Education
B.E. in Information Technology — BITS Pilani, 2020 | CGPA: 8.9 / 10`,
  ],

  'Senior Engineer': [
    `Professional Summary
Senior Software Engineer with 7 years of experience leading technical initiatives and delivering complex distributed systems. Expertise in system design, performance optimization, and engineering mentorship.

Work Experience
Senior Engineer — Luminary Tech, Bangalore (2021 – Present)
• Architected a high-availability microservices platform processing 5M+ daily transactions
• Led a team of 5 engineers, conducting weekly 1:1s and driving technical roadmap decisions
• Reduced infrastructure costs by 40% through right-sizing and reserved instance planning
• Introduced engineering-wide code quality standards reducing production incidents by 55%

Software Engineer — Prismatic Systems, Pune (2017 – 2021)
• Built core payment processing modules handling ₹500Cr+ in annual transaction volume
• Designed and implemented database sharding strategy to support 10x user growth
• Acted as on-call lead for 12 months, driving MTTR from 3 hours to 20 minutes

Skills
Languages: Java, Python, Go, TypeScript
Architecture: Microservices, Event-Driven, CQRS, Domain-Driven Design
Infrastructure: AWS, Kubernetes, Terraform, Kafka
Observability: Datadog, Prometheus, Grafana, OpenTelemetry

Education
B.Tech in Computer Science — IIT Madras, 2017 | CGPA: 9.1 / 10`,
  ],

  'HR Executive': [
    `Professional Summary
Dedicated HR Executive with 4 years of experience in talent acquisition, employee relations, and HR operations. Skilled in end-to-end recruitment, onboarding, and HRMS management.

Work Experience
HR Executive — BrightPath Enterprises, Chennai (2022 – Present)
• Managed end-to-end recruitment for 120+ positions across technical and non-technical roles
• Reduced average time-to-hire from 45 days to 28 days by streamlining sourcing and screening
• Conducted new employee induction programs, onboarding 200+ employees over 2 years
• Handled employee grievances and resolved 95% of issues within the 7-day SLA

HR Assistant — FutureTech Solutions, Coimbatore (2020 – 2022)
• Maintained employee records and updated HRMS with 100% accuracy
• Assisted in payroll processing and coordinated with finance for monthly salary disbursement
• Organized employee engagement activities including town halls and wellness programs

Skills
Recruitment: LinkedIn Sourcing, Naukri, Campus Hiring, Lateral Hiring
HRMS: SAP SuccessFactors, Zoho People, Darwinbox
Core HR: Onboarding, Exit Management, Compliance, Policy Drafting

Education
MBA in Human Resource Management — Symbiosis Institute of Business Management, 2020
B.Com — Madras Christian College, 2018`,
  ],

  'Product Manager': [
    `Professional Summary
Strategic Product Manager with 5 years of experience driving product vision from ideation to launch. Expert at translating user insights and business goals into clear product roadmaps.

Work Experience
Product Manager — Orbis Analytics, Bangalore (2022 – Present)
• Owned the roadmap for core analytics platform with ₹30Cr ARR
• Drove 40% improvement in user activation by redesigning the onboarding flow
• Collaborated with engineering, design, and sales to ship 3 major releases per quarter
• Conducted 50+ customer interviews and synthesized insights to inform product strategy

Associate Product Manager — Nexus Labs, Hyderabad (2019 – 2022)
• Launched a mobile analytics dashboard that became the #1 feature by usage within 60 days
• Wrote PRDs, user stories, and acceptance criteria for a team of 8 engineers and 2 designers
• Ran structured A/B tests to optimize conversion rates on key product flows

Skills
Product Strategy: Roadmapping, OKRs, Competitive Analysis, Go-to-Market
Research: User Interviews, Usability Testing, Persona Development
Analytics: Mixpanel, Amplitude, Looker, SQL
Tools: JIRA, Confluence, Figma, Notion

Education
MBA — IIM Kozhikode, 2019 | B.Tech in Computer Science — NIT Trichy, 2017`,
  ],

  'UX Designer': [
    `Professional Summary
User-centered UX Designer with 3 years of experience crafting intuitive digital experiences for web and mobile platforms. Skilled in the full design process from user research to high-fidelity prototyping.

Work Experience
UX Designer — Pixel & Co., Mumbai (2023 – Present)
• Redesigned the onboarding flow for a fintech app, improving day-7 retention by 35%
• Created and maintained a design system with 150+ reusable components in Figma
• Conducted usability testing with 100+ participants and delivered actionable insights
• Collaborated daily with PMs and engineers to ensure design feasibility

UI/UX Designer — Zeta Digital, Delhi (2021 – 2023)
• Designed responsive web interfaces for 6 client projects across healthcare and edtech
• Reduced support tickets by 20% through an information architecture overhaul
• Delivered design assets optimized for developer handoff using Figma annotations

Skills
Design: Figma, Adobe XD, Sketch, InVision
Research: User Interviews, Card Sorting, A/B Testing, Usability Testing
Core: Wireframing, Prototyping, Design Systems, Accessibility (WCAG 2.1)

Education
B.Des in Interaction Design — National Institute of Design, Ahmedabad, 2021`,
  ],

  'Data Analyst': [
    `Professional Summary
Analytical and detail-oriented Data Analyst with 3+ years of experience turning complex datasets into actionable business insights. Proficient in SQL, Python, and BI tools.

Work Experience
Data Analyst — Mercurius Analytics, Bangalore (2023 – Present)
• Built 15+ Tableau dashboards used daily by leadership to monitor revenue, churn, and KPIs
• Reduced monthly reporting time by 70% by automating data pipelines with Python and Airflow
• Analyzed user behavior data to identify a checkout drop-off pattern that led to a UX fix
• Partnered with marketing to design A/B tests, improving email open rates by 18%

Junior Analyst — Insight IQ, Hyderabad (2021 – 2023)
• Developed SQL queries and data models for client-facing reporting product
• Created weekly executive reports summarizing performance across 10 business units
• Cleaned and validated large datasets ensuring 99%+ data quality

Skills
Languages: SQL (PostgreSQL, BigQuery), Python (pandas, NumPy), R
BI Tools: Tableau, Power BI, Looker, Google Data Studio
Other: Excel (Advanced), A/B Testing, Statistical Analysis

Education
B.Sc. in Statistics — St. Xavier's College, Mumbai, 2021
Certification: Google Data Analytics Professional Certificate, 2022`,
  ],

  'Sales Executive': [
    `Professional Summary
Results-oriented Sales Executive with 5 years of B2B SaaS experience. Consistent top performer with a track record of exceeding quarterly targets across mid-market and enterprise segments.

Work Experience
Sales Executive — CloudEdge Technologies, Bangalore (2022 – Present)
• Exceeded sales targets by 120% in the last fiscal year, generating ₹4.2Cr in new ARR
• Built and managed a pipeline of 80+ qualified opportunities using Salesforce CRM
• Closed 6 enterprise deals with ACV above ₹50L each through multi-stakeholder engagement
• Collaborated with the SDR team to optimize outreach sequences, improving conversion by 25%

Inside Sales Representative — Sapphire Software, Pune (2019 – 2022)
• Managed a portfolio of 60 SMB accounts with an average deal size of ₹8L
• Achieved 115% of quota for 8 consecutive quarters
• Onboarded and trained 3 new sales representatives on product and CRM processes

Skills
Sales: B2B SaaS, Solution Selling, MEDDIC, Account-Based Selling
CRM: Salesforce, HubSpot, Zoho CRM
Tools: LinkedIn Sales Navigator, ZoomInfo, Outreach
Core: Negotiation, Forecasting, Pipeline Management

Education
BBA in Marketing — Christ University, Bangalore, 2019`,
  ],

  'Marketing Manager': [
    `Professional Summary
Creative and data-driven Marketing Manager with 6 years of experience building brands and driving growth across digital and offline channels. Expertise in content marketing, performance marketing, and team leadership.

Work Experience
Marketing Manager — Luminary Brands, Bangalore (2022 – Present)
• Led a team of 6 marketers managing an annual budget of ₹2.5Cr across paid, organic, and events
• Grew organic website traffic by 180% in 18 months through structured SEO and content strategy
• Launched 3 new product lines with integrated go-to-market campaigns achieving 110% of pipeline targets
• Reduced customer acquisition cost by 30% by optimizing the paid media mix

Senior Marketing Executive — Vega Digital, Mumbai (2018 – 2022)
• Managed social media presence growing followers by 250K across platforms in 2 years
• Produced weekly email newsletters to 80,000 subscribers with an avg. open rate of 32%
• Coordinated participation in 10 industry events per year

Skills
Digital: SEO, SEM, Social Media, Email Marketing, Affiliate
Analytics: Google Analytics 4, HubSpot, Meta Ads Manager, Semrush
Tools: Canva, Adobe Creative Suite, Mailchimp, Hootsuite

Education
MBA in Marketing — XLRI Jamshedpur, 2018 | B.Com — Delhi University, 2016`,
  ],

  'DevOps Engineer': [
    `Professional Summary
DevOps Engineer with 4 years of experience building CI/CD pipelines, cloud infrastructure, and containerized deployments. Passionate about reducing toil and improving deployment velocity.

Work Experience
DevOps Engineer — Cloudform Technologies, Hyderabad (2022 – Present)
• Designed CI/CD pipelines using Jenkins and GitHub Actions, reducing release cycles from 2 weeks to 3 days
• Migrated 40+ microservices to Kubernetes on AWS EKS, improving resource utilization by 50%
• Built centralized observability stack using Prometheus and Grafana, reducing MTTR from 4 hours to 45 minutes
• Implemented Infrastructure as Code using Terraform, eliminating manual provisioning errors

Cloud Engineer — DataStream Inc., Bangalore (2020 – 2022)
• Managed multi-account AWS environment with 100+ EC2 instances
• Implemented AWS WAF and GuardDuty to improve security posture
• Automated database backups and disaster recovery testing

Skills
Cloud: AWS (EC2, EKS, RDS, Lambda, S3), GCP
Containers: Docker, Kubernetes, Helm
CI/CD: Jenkins, GitHub Actions, ArgoCD
IaC: Terraform, Ansible, CloudFormation
Monitoring: Prometheus, Grafana, Datadog, ELK Stack

Education
B.Tech in Computer Science — Amrita University, 2020
Certification: AWS Certified Solutions Architect – Associate, 2022`,
  ],

  'QA Engineer': [
    `Professional Summary
Detail-oriented QA Engineer with 4 years of experience in manual and automated testing for web and mobile applications. Proven ability to identify critical defects early in the development cycle.

Work Experience
QA Engineer — Veritas Software, Chennai (2022 – Present)
• Designed and maintained automated test suites using Playwright and Cypress covering 70% of critical flows
• Reduced regression testing time from 3 days to 4 hours through automation
• Led API testing using Postman and REST Assured, uncovering 25+ critical defects pre-release

Manual QA Analyst — Softwave Solutions, Coimbatore (2020 – 2022)
• Executed test cases for web and mobile applications across 12 product releases
• Reported and tracked 300+ bugs in JIRA with detailed reproduction steps
• Performed cross-browser and cross-device compatibility testing

Skills
Automation: Playwright, Cypress, Selenium, REST Assured
API Testing: Postman, Newman, SoapUI
Performance: JMeter, k6
Tools: JIRA, TestRail, Git, BrowserStack

Education
B.E. in Electronics and Communication — PSG College of Technology, 2020`,
  ],

  default: [
    `Professional Summary
Dedicated professional with 4 years of experience delivering high-quality results in a fast-paced environment. Strong analytical and communication skills with a consistent track record of contributing to team goals.

Work Experience
Senior Analyst — Meridian Consulting, Bangalore (2022 – Present)
• Managed key client accounts and delivered quarterly business reviews to senior leadership
• Led cross-functional projects involving operations, technology, and finance teams
• Developed process improvement initiatives that reduced operational costs by 15%
• Mentored and coached 3 junior team members on analytical frameworks

Analyst — Apex Services, Mumbai (2020 – 2022)
• Conducted research and analysis to support strategic business decisions for 10+ clients
• Created detailed reports and presentations for C-suite executives
• Maintained accurate records and ensured compliance with internal standards

Skills
Core: Data Analysis, Project Management, Stakeholder Communication, Process Improvement
Tools: MS Excel, PowerPoint, Tableau, Salesforce, JIRA
Soft Skills: Leadership, Critical Thinking, Collaboration, Problem-Solving

Education
MBA — Indian School of Business, Hyderabad, 2020
B.Com — St. Stephen's College, Delhi, 2018`,
  ],
}

// ─── Ticket Templates ─────────────────────────────────────────────────────────

const TICKET_TEMPLATES: Record<string, { subjects: string[]; descriptions: string[] }> = {
  payroll: {
    subjects: [
      'Salary not credited for this month',
      'Incorrect deductions in last payslip',
      'PF contribution mismatch',
      'Payslip not generated for last month',
      'Reimbursement claim pending since last quarter',
      'HRA calculation appears incorrect',
      'Tax deduction higher than expected',
    ],
    descriptions: [
      'My salary for this month has not been credited to my bank account. The usual disbursement date has passed and there is still no transaction. I have verified with my bank and nothing is pending on their end. Kindly check the payroll run and confirm the expected date of payment. Please escalate if necessary as I have upcoming financial obligations.',
      'I noticed that the professional tax deduction in my last payslip is higher than it should be based on my salary slab. Additionally, the HRA component seems to have been calculated on a base that does not match my revised CTC from the beginning of this year. Please review my payslip and issue a corrected version if there is an error.',
      'The PF contribution reflected in my latest payslip does not match the amount deposited with EPFO for the same month. I would like this discrepancy to be investigated and resolved. Please also confirm whether any shortfall will be deposited and by when.',
      'I submitted a reimbursement claim for travel and accommodation expenses incurred during an offsite visit last quarter. It has been over 45 days and the amount has not been credited despite my manager approving the claim on time. Kindly provide an update on the status and the expected payment date.',
    ],
  },
  leave: {
    subjects: [
      'Leave balance showing incorrect count',
      'Leave approval pending for over 5 days',
      'Maternity leave policy clarification needed',
      'Leave encashment request for current FY',
      'Sick leave not updated in portal',
      'LOP marked despite approved leave',
      'Annual leave carry-forward query',
    ],
    descriptions: [
      'My leave balance in the HR portal is showing fewer days than I should have. I applied for a few days earlier this year which were approved, and another request was cancelled and should have been restored. Could you please audit my leave ledger and correct the balance? I am planning to apply for leave next month and need an accurate count.',
      'I applied for casual leave through the self-service portal several days ago. The request has been pending without any response from my reporting manager despite follow-up reminders I sent on multiple occasions. Kindly help escalate this approval as I have personal commitments planned and need confirmation at the earliest.',
      'I would like clarification on the maternity leave policy. I understand we are entitled to 26 weeks of paid leave as per the Maternity Benefit Act, but a colleague mentioned the company policy may provide additional paid leave on top of this. Could you please share the official policy document and confirm the total entitlement and application process?',
      'I have accumulated annual leave days that I was unable to utilize this financial year due to project commitments. I would like to request encashment of these days as per the company leave encashment policy. Please let me know the process and any documentation required to initiate this request.',
    ],
  },
  attendance: {
    subjects: [
      'Attendance not captured for a recent working day',
      'WFH days not reflected in attendance log',
      'Biometric punch-in failing at office entry',
      'Incorrect LOP deduction due to system error',
      'Attendance regularization request',
      'Half-day record not updated in system',
    ],
    descriptions: [
      'My attendance for a recent working day is not showing in the HR portal despite me being present in the office. I badged in and out correctly but the system appears to have missed the entry. I would like to request an attendance regularization for that date. My manager can confirm my presence if needed.',
      'I have been working from home on approved hybrid work days, but the attendance portal is marking these days as absent instead of WFH present. This has been happening for several weeks and is affecting my attendance percentage. Please correct the records and confirm the fix going forward.',
      'The biometric reader at the office entry gate has been failing to capture fingerprints for several days. Multiple colleagues in my team are facing the same issue. We have been signing in manually with security but those entries are not syncing to the attendance system. Please arrange for the device to be repaired and sync the manual records for all affected employees.',
      'My last payslip has an LOP deduction for days when I was not absent. I believe this is because my approved leave application was not correctly linked to the attendance record. I would like the attendance records corrected and the LOP deduction reversed in the next payroll cycle.',
    ],
  },
  policy: {
    subjects: [
      'Clarification on work-from-home policy',
      'Travel reimbursement policy for client visits',
      'Flexible working hours policy query',
      'Mobile and internet allowance eligibility',
      'Notice period buyout policy',
      'Performance bonus eligibility criteria',
    ],
    descriptions: [
      'I would like clarification on the current work-from-home policy. Our team has been following an informal hybrid arrangement but I have not seen an official policy document. With upcoming changes in team management, I want to ensure the arrangement is properly documented and formally approved. Could you please share the official WFH policy?',
      'I have been visiting clients regularly and submitting travel reimbursement claims. A recent claim was partially rejected citing an expense cap I was not previously aware of. Could you please share the complete travel reimbursement policy including limits for road travel, accommodation, and daily allowance so I can align future claims accordingly?',
      'I recently received an external job offer and need to understand our notice period buyout policy before making a decision. Specifically I want to know whether notice period buyouts are permitted, how the buyout amount is calculated, and whether accumulated leave can be adjusted against the notice period.',
      'My role requires using my personal mobile phone for client communication and remote access to company systems. I was informed during onboarding that eligible employees receive a mobile and internet allowance, but this has never been added to my compensation. Could you clarify the eligibility criteria and initiate the allowance if I qualify?',
    ],
  },
  it_support: {
    subjects: [
      'Laptop running very slow — needs inspection',
      'VPN connection dropping frequently',
      'Unable to access internal tools after password reset',
      'Corporate email not syncing on mobile',
      'Request for software license',
      'External monitor not detected after desk move',
    ],
    descriptions: [
      'My company-issued laptop has been extremely slow for the past several days. Boot time has increased significantly and productivity applications frequently freeze. I have already cleared caches and restarted multiple times with no improvement. This is impacting my daily work significantly. Could you please arrange for IT to inspect and service the device at the earliest?',
      'I am experiencing frequent VPN disconnections throughout the working day. The connection drops every 15-30 minutes, disrupting access to internal tools and requiring repeated reconnections. This issue started after a recent VPN client update and several colleagues on the same floor are reporting the same problem. Please investigate and provide a fix.',
      'I am unable to access several internal tools since this morning and keep getting access denied errors. I have not changed any settings and had full access yesterday. My login to other systems like Slack and email is working fine. Please restore my access as soon as possible as I have urgent deliverables that depend on these tools.',
      'My corporate email account is not syncing on my mobile device since I changed my password. I have removed and re-added the account but still get an authentication error. I need mobile access as I travel frequently for meetings. Please guide me through the correct configuration or reset the mobile access credentials.',
    ],
  },
  general: {
    subjects: [
      'Request for experience letter',
      'Employee ID card replacement',
      'Referral bonus not yet credited',
      'Parking slot request',
      'Office access issue after badge renewal',
      'Cafeteria account correction needed',
    ],
    descriptions: [
      'I need an experience letter for my period of employment with the company. The letter is required for a financial application and the institution has requested it on official letterhead with an authorized HR signature. Could you please issue the experience letter at the earliest? Please let me know if any additional authorization is required.',
      'My employee ID card was lost recently. I have completed the required formalities. Please initiate the process for a replacement ID card and advise on the applicable fee if any and the expected turnaround time. In the meantime I am using a visitor pass to access the office, which is inconvenient for daily entry.',
      'I referred a candidate who has now joined the company and completed the minimum tenure required for referral bonus eligibility. The referral bonus has not yet been credited to my account. Could you please confirm whether my referral was registered correctly and initiate the payment if it is due?',
      'I have been experiencing intermittent access issues with my employee badge after it was recently renewed. The badge works at the main entrance but fails at certain restricted zones that I have authorized access to. Please re-configure the access permissions on the new badge to match my previous access level.',
    ],
  },
}

// ─── Candidate Names ──────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Neha', 'Rohan', 'Anjali',
  'Karthik', 'Divya', 'Aditya', 'Pooja', 'Sachin', 'Isha', 'Manish', 'Ritu',
  'Deepak', 'Kavya', 'Suresh', 'Meera', 'Amit', 'Shruti', 'Varun', 'Pallavi',
  'Rajesh', 'Ananya', 'Siddharth', 'Bhavna', 'Gaurav', 'Lakshmi', 'Kunal',
  'Tanya', 'Pavan', 'Simran', 'Mohit', 'Rinku', 'Dhruv', 'Nandini', 'Lokesh',
  'Rajeev', 'Swati', 'Nitin', 'Geeta', 'Harsh', 'Riya', 'Akash', 'Sunita',
  'Vivek', 'Seema', 'Prasad', 'Rekha', 'Tarun', 'Komal', 'Ajay', 'Nisha',
  'Girish', 'Mamta', 'Yash', 'Usha', 'Pankaj', 'Rashmi',
]

const LAST_NAMES = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Patel', 'Joshi', 'Nair', 'Iyer',
  'Reddy', 'Gupta', 'Mehta', 'Shah', 'Pillai', 'Rao', 'Menon', 'Mishra',
  'Sinha', 'Bansal', 'Das', 'Kapoor', 'Malhotra', 'Tiwari', 'Saxena', 'Bose',
  'Pandey', 'Chatterjee', 'Kulkarni', 'Desai', 'Patil', 'Kaur', 'Bhat',
  'Nambiar', 'Varma', 'Krishnan', 'Rajan', 'Bajaj', 'Chopra', 'Arora',
  'Dutta', 'Mukherjee', 'Bhatt', 'Jain', 'Agarwal', 'Mathur', 'Oberoi',
]

const CANDIDATE_STATUSES: ('applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected')[] = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']
const TICKET_STATUSES: ('open' | 'in_progress' | 'resolved' | 'closed')[] = ['open', 'in_progress', 'resolved', 'closed']
const TICKET_PRIORITIES: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent']
const TICKET_CATEGORIES = Object.keys(TICKET_TEMPLATES) as (keyof typeof TICKET_TEMPLATES)[]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Clearing existing recruitment and ticket data…')
  await db.execute(sql`DELETE FROM candidates`)
  await db.execute(sql`DELETE FROM job_postings`)
  await db.execute(sql`DELETE FROM tickets`)

  // ── 1. Job Postings ────────────────────────────────────────────────────────
  console.log('Inserting job postings…')
  const jobValues: NewJobPosting[] = JOB_TITLES.flatMap(title => {
    const count = randInt(2, 4)
    return Array.from({ length: count }, () => ({
      title,
      department: pick(DEPARTMENTS),
      location:   pick(LOCATIONS),
      type:       pick(['full-time', 'part-time', 'contract'] as const),
      experience: `${randInt(1, 8)} years`,
      description: JOB_DESCRIPTIONS[title] ?? JOB_DESCRIPTIONS['Software Engineer'],
      status:     pick(['open', 'closed', 'on-hold'] as const),
      openings:   randInt(1, 5),
      createdAt:  daysAgo(randInt(30, 365)),
    }))
  })

  const insertedJobs = await db.insert(jobPostings).values(jobValues).returning()
  console.log(`  Inserted ${insertedJobs.length} job postings`)

  // ── 2. Candidates ──────────────────────────────────────────────────────────
  console.log('Inserting candidates…')
  const BATCH = 200
  let totalCandidates = 0

  for (let i = 0; i < insertedJobs.length; i += BATCH) {
    const batchJobs = insertedJobs.slice(i, i + BATCH)
    const candidateValues: NewCandidate[] = batchJobs.flatMap(job => {
      const count = randInt(4, 15)
      const resumePool = RESUME_TEMPLATES[job.title] ?? RESUME_TEMPLATES.default
      return Array.from({ length: count }, () => {
        const firstName = pick(FIRST_NAMES)
        const lastName  = pick(LAST_NAMES)
        const emailLocal = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(10, 99)}`
        return {
          jobId:     job.id,
          firstName,
          lastName,
          email:     `${emailLocal}@gmail.com`,
          phone:     `+91 ${randInt(70000, 99999)} ${randInt(10000, 99999)}`,
          resumeText: pick(resumePool),
          status:    pick(CANDIDATE_STATUSES),
          appliedAt: daysAgo(randInt(1, 180)),
        }
      })
    })

    if (candidateValues.length > 0) {
      await db.insert(candidates).values(candidateValues)
      totalCandidates += candidateValues.length
    }
  }
  console.log(`  Inserted ${totalCandidates} candidates`)

  // ── 3. Tickets ────────────────────────────────────────────────────────────
  console.log('Inserting support tickets…')

  // Fetch real employee IDs from DB
  const empRows = await db.execute(sql`SELECT id FROM employees LIMIT 200`)
  const empIds = (empRows.rows as { id: string }[]).map(r => r.id)

  if (empIds.length === 0) {
    console.log('  No employees found — skipping tickets. Run the main seed first.')
    return
  }

  const ticketValues: NewTicket[] = []
  let ticketNum = 1

  for (const empId of empIds) {
    const count = randInt(0, 3)
    for (let i = 0; i < count; i++) {
      const category = pick(TICKET_CATEGORIES)
      const tpl = TICKET_TEMPLATES[category]
      const createdAt = daysAgo(randInt(1, 365))
      const status    = pick(TICKET_STATUSES)

      ticketValues.push({
        ticketNumber: `TKT-${String(ticketNum++).padStart(6, '0')}`,
        employeeId:   empId,
        category:     category as 'payroll' | 'leave' | 'attendance' | 'policy' | 'it_support' | 'general',
        priority:     pick(TICKET_PRIORITIES),
        subject:      pick(tpl.subjects),
        description:  pick(tpl.descriptions),
        status,
        assignedTo:   status !== 'open' ? pick(empIds) : null,
        createdAt,
        updatedAt:    new Date(),
        resolvedAt:   status === 'resolved' || status === 'closed' ? daysAgo(randInt(1, 30)) : null,
      })
    }
  }

  // Insert in batches
  for (let i = 0; i < ticketValues.length; i += BATCH) {
    await db.insert(tickets).values(ticketValues.slice(i, i + BATCH))
  }
  console.log(`  Inserted ${ticketValues.length} support tickets`)

  console.log('\nDone! Recruitment and helpdesk data seeded with realistic content.')
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
