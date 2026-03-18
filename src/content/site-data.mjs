export const site = {
  name: 'Walkcat',
  baseUrl: 'https://walkcat.ie',
  founder: 'Vladislav Cernega',
  contactEmail: 'hello@walkcat.ie',
  location: 'Dublin, Ireland',
  ogImagePath: '/assets/og/walkcat-og.svg',
  publishedDate: '2026-03-18',
  pages: {
    home: {
      path: '/',
      title: 'Business Systems & Web Design for Irish SMEs | Walkcat',
      description:
        'Remove manual work, fix slow processes, and build websites that generate leads. Walkcat helps Irish trade and service businesses run faster without the agency overhead. Based in Dublin.',
      keywords:
        'business automation Ireland, workflow automation small business Ireland, web design trade business Ireland, CRM setup small business Dublin, reduce admin work Ireland, business process improvement Dublin, business systems consultant Ireland'
    },
    services: {
      path: '/services/',
      title: 'Services - Websites, Integrations & Process Improvement | Walkcat',
      description:
        'From lead-generating websites to workflow automation and CRM setup, Walkcat delivers practical technical fixes for Irish small businesses. No packages, no buzzwords.',
      keywords:
        'business automation Ireland, website for trade business Ireland, CRM setup small business Ireland, workflow automation Ireland, business systems consultant Dublin'
    },
    process: {
      path: '/how-i-work/',
      title: 'How I Work - Practical Systems Improvement | Walkcat Ireland',
      description:
        'A calm, structured working method. Understand the problem first, fix the bottleneck, and build the right thing for Irish trade and service businesses.',
      keywords:
        'business process improvement Ireland, workflow consultant Ireland, systems consultant Dublin, practical automation Ireland'
    },
    cases: {
      path: '/case-studies/',
      title: 'Case Studies - Real Business Problems Fixed | Walkcat Ireland',
      description:
        'Examples of trade businesses, service companies, and small teams removing manual work, fixing slow processes, and getting websites that generate enquiries.',
      keywords:
        'case studies business automation Ireland, workflow automation examples Ireland, trade business website case study'
    },
    about: {
      path: '/about/',
      title: 'About - Business Systems Partner for Irish SMEs | Walkcat',
      description:
        'Walkcat is run by Vladislav Cernega in Dublin. Practical help for Irish trade and service businesses that need better systems, less admin, and websites that work.',
      keywords:
        'business systems partner Ireland, about Walkcat, web design and automation Dublin, operations consultant Ireland'
    },
    contact: {
      path: '/start-here/',
      title: 'Start Here - Describe Your Problem | Walkcat Ireland',
      description:
        'Tell Walkcat what is slow, manual, or broken in your business. No technical knowledge needed. Get a direct response within one working day.',
      keywords:
        'business automation contact Ireland, describe your problem Walkcat, workflow consultant Dublin contact'
    },
    thanks: {
      path: '/start-here/thanks/',
      title: 'Thanks - Your Brief Is Ready | Walkcat',
      description:
        'Your Walkcat intake draft is ready to send. If your email app did not open, use the fallback details on this page.'
    },
    blog: {
      path: '/blog/',
      title: 'Blog - Practical Advice for Irish SMEs | Walkcat',
      description:
        'Plain-language articles on business systems, CRM setup, admin reduction, websites that generate enquiries, and workflow automation for Irish SMEs.',
      keywords:
        'business automation blog Ireland, CRM advice Ireland, website strategy for trades Ireland, reduce admin work small business Ireland'
    },
    notFound: {
      path: '/404.html',
      title: 'Page Not Found | Walkcat',
      description:
        'The page you requested could not be found. Use the navigation to get back to Walkcat services, case studies, or the intake form.'
    }
  }
};

export const serviceSchemas = [
  {
    name: 'Websites That Support Growth',
    description:
      'Lead-generating websites for Irish trade and service businesses, built to turn visitors into enquiries.'
  },
  {
    name: 'Integrations and Workflow Fixes',
    description:
      'Practical integrations between CRMs, inboxes, calendars, forms, and job systems to remove manual work.'
  },
  {
    name: 'Process Audits and Bottleneck Removal',
    description:
      'Structured audits of how work flows through a business so the real bottleneck can be identified and fixed.'
  },
  {
    name: 'Automation and Repetitive Task Removal',
    description:
      'Targeted automation for recurring admin, follow-up, reporting, and data movement across business tools.'
  },
  {
    name: 'Custom Internal Tools',
    description:
      'Lightweight internal dashboards, quoting systems, trackers, and forms tailored to the business.'
  },
  {
    name: 'Practical IT and Technical Support',
    description:
      'Direct technical help with setup, troubleshooting, and day-to-day systems issues affecting small teams.'
  }
];

export const blogPosts = [
  {
    slug: 'why-your-business-is-slower-than-it-needs-to-be',
    title: 'Why Your Business Is Slower Than It Needs to Be (And How to Find the Bottleneck)',
    description:
      'A practical way for Irish SME owners to identify the real bottleneck behind slow quoting, missed follow-up, and admin-heavy workflows.',
    published: '2026-03-18',
    readTime: '7 min read',
    category: 'Process Improvement',
    audience: 'Founder-led businesses, trade companies, service teams',
    keyword: 'business process improvement Ireland',
    heroSummary:
      'If work feels slower every month, the issue is usually not effort. It is the process underneath the effort. This is how to find the real bottleneck before you waste money fixing the wrong thing.',
    sidebarFacts: [
      'Best for teams of 2 to 30 people',
      'Useful when quoting, admin, or follow-up feels chaotic',
      'Often the fastest way to scope the right fix'
    ],
    sections: [
      {
        title: 'Slow businesses usually do not look broken from the outside',
        paragraphs: [
          'Most owner-led businesses do not wake up one morning with a dramatic systems failure. What happens instead is much less obvious. A quote takes a little longer than it used to. Someone keeps a mental list because there is nowhere reliable to track the work. A follow-up gets missed because the inbox was busy. Staff create workarounds because the official process no longer reflects reality.',
          'That kind of slowdown is dangerous because it still feels survivable. The business keeps running, so nobody stops to look closely. The founder assumes the team needs to move faster. The team assumes the tools are the problem. In reality, the business has usually outgrown a process that was never designed for the current workload.',
          'When Irish SMEs talk about needing automation, a new CRM, or a better website, they are often describing symptoms. The more valuable question is simpler: where does work actually get stuck?'
        ]
      },
      {
        title: 'The visible problem is rarely the real bottleneck',
        paragraphs: [
          'A company might say the quoting process is too slow. That sounds like a quoting problem. But the real bottleneck could be pricing data that lives in three places, approvals that happen informally over WhatsApp, or a template that only one person understands. If you automate the final quote document without fixing those issues first, the process is still slow. It is just slow in a shinier way.',
          'The same thing happens with lead follow-up. Owners often think they need staff to reply faster. Sometimes they do. But just as often, the issue is that leads arrive without a clear owner, no one can see response status, and the business has no agreed next step after the first contact. More discipline will not solve a visibility problem.',
          'This is why problem-first work matters. If you start with the tool, you will usually buy or build the wrong thing. If you start with the bottleneck, the right solution becomes much more obvious.'
        ]
      },
      {
        title: 'How to map the real workflow',
        paragraphs: [
          'Take one business process that feels slow. Do not start with the software stack. Start with the path the work takes in real life. For example: a lead comes in, someone reviews it, information is gathered, a quote is prepared, the customer replies, the job is booked, and the invoice goes out. Write every step down in plain language.',
          'Then add who touches the process at each stage. Which person checks the inbox? Who asks for missing details? Who updates the spreadsheet? Who sends the quote? Who knows whether the lead has gone cold? If a step depends on memory, write that down too. If two people both believe the other one is responsible, that is a bottleneck in disguise.',
          'The point is not to create a perfect process diagram. The point is to stop talking about the business at a high level and look at the exact moments where time, clarity, or ownership breaks down.'
        ]
      },
      {
        title: 'Three places bottlenecks usually hide',
        paragraphs: [
          'The first is handoffs. Every time one person finishes a step and another person needs to pick it up, there is a chance for delay, duplication, or loss of context. If the handoff depends on a message, a memory, or a spreadsheet note, it is fragile.',
          'The second is duplicate data entry. If information is entered into a form, copied into a CRM, then added to a job sheet and an invoice tool, you do not just have wasted time. You have four chances for inconsistency. That type of admin drag quietly spreads across the whole week.',
          'The third is hidden decision-making. If the business relies on one person to know how pricing works, which leads are worth prioritising, or what stage a client is at, the process is not actually a process. It is an undocumented person dependency.'
        ]
      },
      {
        title: 'What to fix first',
        paragraphs: [
          'Start with the bottleneck that affects either revenue speed or staff time most directly. In a trade business, that is often quoting. In a service business, it is often lead handling or scheduling. In a small sales team, it is usually pipeline visibility and follow-up discipline.',
          'Do not begin with the most interesting fix. Begin with the step that creates the widest downstream friction. If the intake information arrives incomplete every time, improve intake before touching reporting. If the team cannot see who owns a lead, fix ownership before you add automation.',
          'The right early fix is usually smaller than people expect. Sometimes it is a new intake structure, a simple CRM stage change, or one connection between tools. The goal is not to modernise everything. The goal is to remove the pressure point that keeps slowing everything else down.'
        ]
      },
      {
        title: 'A useful rule for Irish SMEs',
        paragraphs: [
          'If a process depends on memory, repeated copy-paste, or one person being available, it is already too fragile for a growing business. That does not mean you need enterprise software. It means the business needs a clearer system than it has today.',
          'For most Irish SMEs, the opportunity is not digital transformation in the abstract. It is practical operational improvement. Faster quoting. Cleaner follow-up. Better visibility. Less admin. More consistency. Those are the wins that change the week, not the buzzwords.',
          'If you can describe what feels slow in plain language, you already have enough to start. That is usually the beginning of a much better system.'
        ]
      }
    ]
  },
  {
    slug: 'the-real-cost-of-manual-admin-in-irish-small-businesses',
    title: 'The Real Cost of Manual Admin in Irish Small Businesses',
    description:
      'Manual admin is not just annoying. It quietly drains owner time, slows response speed, and creates avoidable errors. This is what it costs in practice.',
    published: '2026-03-18',
    readTime: '8 min read',
    category: 'Admin Reduction',
    audience: 'Trade businesses, service businesses, admin-heavy teams',
    keyword: 'reduce admin time business Ireland',
    heroSummary:
      'Manual admin feels normal in a lot of SMEs because it arrives in small pieces. But when the same work is repeated every day, it becomes one of the most expensive parts of the business.',
    sidebarFacts: [
      'Admin cost usually hides inside staff time',
      'Copy-paste work also creates error risk',
      'Good fixes often pay back quickly'
    ],
    sections: [
      {
        title: 'Manual admin rarely gets measured properly',
        paragraphs: [
          'Ask a small business owner how much manual admin exists in the business and the answer is usually vague. Everyone knows there is too much of it, but very few teams track how much time it actually takes. That is one reason it stays in place for so long.',
          'Manual admin is usually scattered across the week. Ten minutes updating a spreadsheet. Fifteen minutes copying form details into a CRM. Twenty minutes chasing missing information before a quote can go out. A repeated check to see whether an invoice has been paid. None of those moments feel strategic enough to justify attention on their own.',
          'Together, they create a constant tax on the business. Owners feel busy. Staff feel behind. Customers wait longer than they should. The business then treats the symptoms as staffing or time-management issues, even when the real problem is repeated low-value work.'
        ]
      },
      {
        title: 'The first cost is lost capacity',
        paragraphs: [
          'When a person spends two hours a day on repetitive admin, that is not just two hours gone. It is two hours not spent on higher-value work. Quotes are slower. Customer communication is later. Sales follow-up becomes inconsistent. Improvements get postponed because everyone is occupied keeping the old process alive.',
          'This matters even more in a small team because roles are rarely isolated. The same person might handle incoming enquiries, coordinate jobs, prepare invoices, and answer operational questions. If their day is clogged with manual updates, the rest of the business feels that drag.',
          'Capacity is not only about hiring more people. Often it is about removing the work that should never have required a person in the first place.'
        ]
      },
      {
        title: 'The second cost is avoidable errors',
        paragraphs: [
          'Every time data is copied from one place to another, there is a chance something changes, gets dropped, or ends up out of date. That might mean a misspelled customer name, the wrong contact number, a forgotten appointment, or a quote sent with old pricing. Small mistakes compound trust problems quickly.',
          'Error correction is a hidden form of admin as well. When the wrong information gets into the system, staff have to stop and fix it. That means checking the original source, confirming the correct version, and updating multiple tools again. The correction work often costs more than the original task.',
          'Businesses with high manual handling do not just move slower. They become less reliable, even when the team is trying hard.'
        ]
      },
      {
        title: 'The third cost is slower response time',
        paragraphs: [
          'In both trade and service businesses, speed matters commercially. A lead that waits half a day for a reply is harder to convert than one that gets a clear acknowledgement in minutes. A quote that takes three days to prepare creates doubt before the work has even started.',
          'Manual admin directly affects response speed because the same people who should be replying are often buried in routine operations. When inbox handling, data entry, scheduling, and follow-up all depend on manual steps, urgent work gets mixed together with repetitive work. The customer only sees the delay.',
          'For many SMEs, improving response time is not about asking people to be faster. It is about reducing the manual noise around them so they can respond when it matters.'
        ]
      },
      {
        title: 'How to spot admin work that should be removed',
        paragraphs: [
          'Look for tasks that happen often, follow a predictable pattern, and do not require real judgment. Status updates, confirmation emails, record creation, appointment reminders, invoice triggers, and lead routing are common examples. If the same information is being typed more than once, that is another strong signal.',
          'Then ask whether the task exists because of a process gap, a tool gap, or a connection gap. A process gap means the team has no agreed structure. A tool gap means the current tool genuinely cannot handle the job. A connection gap means the tools are fine but they are isolated from each other.',
          'That distinction matters because the right solution changes. Sometimes you need a better workflow. Sometimes you need a simple integration. Sometimes you need both.'
        ]
      },
      {
        title: 'What better looks like',
        paragraphs: [
          'Better does not always mean a dramatic rebuild. A useful improvement might be a form that captures the right information the first time, a CRM stage that triggers the right reminder, or a job completion step that starts invoicing automatically. Small changes, applied in the right order, remove a surprising amount of load.',
          'The best result is not just fewer clicks. It is more clarity. The team knows what has happened, what happens next, and where to look. The founder no longer has to act as the missing system between disconnected tools or undocumented processes.',
          'If the business feels permanently busy but progress still feels slow, manual admin is often a major part of the reason. Once that work is reduced, the business usually feels lighter very quickly.'
        ]
      }
    ]
  },
  {
    slug: 'how-to-choose-a-crm-for-a-small-trade-business-in-ireland',
    title: 'How to Choose a CRM for a Small Trade Business in Ireland (2026)',
    description:
      'A plain-language guide for Irish trade businesses choosing a CRM that fits quoting, follow-up, and day-to-day operations without adding unnecessary complexity.',
    published: '2026-03-18',
    readTime: '8 min read',
    category: 'CRM Setup',
    audience: 'Trade businesses, contractors, installation companies',
    keyword: 'CRM for trade business Ireland',
    heroSummary:
      'A CRM should make follow-up and visibility easier. If it creates more admin than it removes, it is the wrong fit. This is how to choose one with your real workflow in mind.',
    sidebarFacts: [
      'Best when leads, quotes, and follow-up are inconsistent',
      'The workflow matters more than the feature list',
      'Simple adoption beats sophisticated software'
    ],
    sections: [
      {
        title: 'Most trade businesses do not need the biggest CRM',
        paragraphs: [
          'A lot of small trade businesses delay CRM setup because they assume it means buying complex sales software built for large teams. That assumption causes two problems. Some businesses avoid CRM altogether and stay in spreadsheets. Others buy something too heavy, then stop using it because it creates more work than it saves.',
          'For a trade business in Ireland, the question is not which CRM has the most features. The question is which one supports the real workflow of the business: enquiries, site visits, quotes, follow-up, won work, and handoff into delivery or job management.',
          'If the system does not fit those stages cleanly, people will work around it. And once people start working around a CRM, the data stops being trustworthy.'
        ]
      },
      {
        title: 'Start with the process, not the software',
        paragraphs: [
          'Before comparing platforms, map the sales process as it actually works. Where do leads come from? What information is needed before a quote can be prepared? Who follows up? How many quotes are live at once? When is a lead considered dead? What needs to happen the moment a quote is accepted?',
          'Those answers matter more than most feature lists because they determine the stages, fields, and automations the CRM needs to support. If the business cannot describe its own process, no CRM comparison will be useful.',
          'Many small teams assume the problem is that they do not have a CRM. Often the first problem is that they do not yet have a clear pipeline structure. Fix that and tool selection gets easier.'
        ]
      },
      {
        title: 'What the CRM must do well',
        paragraphs: [
          'At minimum, the CRM should give the business one trusted place to see open enquiries, quote status, next actions, and ownership. That is the baseline. Without visibility, the system has failed before any automation is added.',
          'It should also reduce manual handling. Good CRM setup means contact details do not need to be typed repeatedly, follow-up tasks can be triggered automatically, and the team can see what happened without checking multiple inboxes or files.',
          'For a trade business, usability on mobile also matters. Owners, estimators, and managers are not always at a desk. If the CRM only works comfortably from a laptop, adoption drops quickly.'
        ]
      },
      {
        title: 'What to be careful of',
        paragraphs: [
          'Be wary of buying software based on demos alone. CRM demos are designed to look smooth. Your real process is not smooth. It includes missing information, urgent calls, duplicated leads, changes after site visits, and people using the system while doing three other things.',
          'Also be cautious with platforms that require extensive setup before they become useful. Some businesses benefit from flexibility. Others get trapped in endless configuration and never reach a stable working system.',
          'A good rule is this: if the team cannot understand how to use the CRM in normal day-to-day work within a short time, it is too complicated for the current stage of the business.'
        ]
      },
      {
        title: 'Common CRM selection questions for Irish SMEs',
        paragraphs: [
          'Should the CRM connect to quoting, email, or invoicing? Usually yes, or at least it should be capable of doing so. If the business has to keep re-entering the same lead data elsewhere, the CRM becomes another silo instead of a central system.',
          'Should the CRM manage jobs too? Sometimes. But not always. In many trade businesses, the clearest setup is a CRM for enquiry and quote management plus a separate job system after the sale, with the handoff between them connected properly.',
          'Should you choose the cheapest option? Only if it still supports the workflow properly. Cheap software that nobody uses is more expensive than the right tool with a sensible setup.'
        ]
      },
      {
        title: 'The real goal',
        paragraphs: [
          'The real goal of CRM setup is not to have a CRM. It is to stop losing visibility, missing follow-up, and relying on memory. The system should help the business respond faster, quote more reliably, and see the pipeline clearly.',
          'For most small trade businesses, the best CRM is the one that the team will actually use because it reflects the business as it really works. That usually means clear stages, focused fields, simple automations, and practical onboarding.',
          'If the business is still asking whether it needs a CRM, the better question may be this: what is the cost of continuing without one? In many cases, that answer is what makes the decision clear.'
        ]
      }
    ]
  },
  {
    slug: 'what-a-good-business-website-actually-does',
    title: "What a Good Business Website Actually Does (And Why Most Don't Do It)",
    description:
      'A practical explanation of what makes a website useful for Irish SMEs: clarity, trust, speed, and a structure that turns visitors into enquiries.',
    published: '2026-03-18',
    readTime: '7 min read',
    category: 'Web Design',
    audience: 'Trade businesses, service companies, owner-led SMEs',
    keyword: 'website for trade business Ireland',
    heroSummary:
      'A website is not useful because it exists. It is useful when it helps the right visitor understand the business quickly and feel confident taking the next step.',
    sidebarFacts: [
      'Best for sites that look fine but underperform',
      'Clarity beats decoration',
      'Speed and trust affect enquiries directly'
    ],
    sections: [
      {
        title: 'Most websites are built to be present, not to perform',
        paragraphs: [
          'A lot of small business websites are treated like a box to tick. The business needs an online presence, so a site gets built, a few pages go live, and everyone moves on. The problem is that being online is not the same as being persuasive.',
          'For Irish trade and service businesses especially, the website often needs to do three jobs at once. It has to explain the work clearly, build enough trust for someone to enquire, and make the next step obvious. If it fails at any one of those, the site becomes passive rather than useful.',
          'This is why a website can look respectable and still generate very little. Good design matters, but design alone is not the job. The job is movement: from uncertain visitor to confident enquiry.'
        ]
      },
      {
        title: 'A good website answers the visitor fast',
        paragraphs: [
          'When someone lands on a business website, they are usually trying to answer a few basic questions immediately. What does this company actually do? Is it relevant to my situation? Do they look credible? What should I do next? If the page makes them work hard for those answers, many of them leave.',
          'This is especially important on mobile, where most traffic arrives. Visitors are often standing on a site, comparing options quickly, or checking whether a company feels legitimate before making contact. Long-winded copy, vague positioning, and weak page structure waste those moments.',
          'The best websites for SMEs are usually clearer, not louder. They say what the business does, who it is for, what problem it solves, and how to get in touch without making the user hunt.'
        ]
      },
      {
        title: 'Trust is built through detail, not hype',
        paragraphs: [
          'Small businesses sometimes try to sound larger or more polished by using generic marketing language. In practice, that often weakens trust. Phrases like leading solutions, bespoke excellence, or innovation-driven service do not help the visitor understand anything concrete.',
          'Trust usually comes from the opposite: specificity. Clear service language. Relevant examples. A process that feels realistic. Contact details that are easy to find. A form that looks cared for. Fast load speed. These signals tell the visitor the business is real and serious.',
          'Case studies, even anonymised ones, are particularly useful because they turn claims into believable outcomes. A good website does not just say the business helps. It shows what better looks like.'
        ]
      },
      {
        title: 'The site should support the business behind it',
        paragraphs: [
          'A website is often treated as a standalone marketing asset, but it should connect cleanly into the rest of the business. If a form submission disappears into a shared inbox, the site is not finished. If enquiries arrive without the information needed to quote properly, the site is creating internal friction.',
          'This is where web design overlaps with systems work. The form fields, the confirmation flow, the lead routing, and the follow-up process all affect whether the website actually helps revenue. The page design is only one layer of performance.',
          'That is also why some redesigns disappoint. The visuals improve, but nothing about the operational path changes, so the business still handles leads slowly and inconsistently.'
        ]
      },
      {
        title: 'What most business websites are missing',
        paragraphs: [
          'They often lack a clear primary call to action. The page may say get in touch somewhere, but it does not guide the visitor to the right next step. Or the copy is written from the business perspective rather than the customer perspective, so it describes services without showing why they matter.',
          'Many sites also bury the strongest credibility points. If the business works across Dublin and Ireland, that should be easy to see. If it solves a very specific type of problem, that should be obvious quickly. If it works well for trades or service companies, that should not be left as an assumption.',
          'And far too many websites still feel slow or awkward on mobile. That alone is enough to reduce trust before a visitor reads anything substantial.'
        ]
      },
      {
        title: 'What a good website actually does',
        paragraphs: [
          'It reduces uncertainty. It helps the right visitor decide that this business probably understands their problem and is worth contacting. That is the practical value of web design for SMEs.',
          'A good website does not need to do everything. It needs to say the right things, structure them clearly, load quickly, and connect smoothly to the business process behind it. When those pieces are aligned, the site becomes commercially useful rather than just visually acceptable.',
          'If a site looks fine but very few quality enquiries come through it, the issue is rarely just aesthetics. More often, the message, structure, trust signals, or follow-up path need to be fixed.'
        ]
      }
    ]
  },
  {
    slug: 'how-irish-service-businesses-are-automating-lead-follow-up',
    title: 'How Irish Service Businesses Are Automating Lead Follow-Up in 2026',
    description:
      'A practical look at how service businesses are reducing missed leads and improving response speed with better systems and lightweight automation.',
    published: '2026-03-18',
    readTime: '7 min read',
    category: 'Lead Follow-Up',
    audience: 'Service businesses, small sales teams, founder-led companies',
    keyword: 'automate lead follow-up Ireland',
    heroSummary:
      'Most missed leads are not caused by a lack of effort. They are caused by weak ownership, slow routing, and no reliable next step. Good follow-up automation solves those gaps without making the business feel robotic.',
    sidebarFacts: [
      'Best for inbox-led enquiry handling',
      'Useful when follow-up depends on memory',
      'Speed and ownership matter more than complexity'
    ],
    sections: [
      {
        title: 'Why good leads still go cold',
        paragraphs: [
          'In a lot of service businesses, new enquiries land in an inbox, then wait. Nobody intends to ignore them. The problem is that the business has no clear system for what happens next. One person checks when they can. Another assumes someone else has already replied. Details are missing. The lead sits still.',
          'By the time anyone responds properly, the prospect may already have contacted two competitors. This is one of the most common revenue leaks in small teams because it happens quietly and repeatedly. The business does not see the lost work directly. It only feels that enquiries are not converting as well as they should.',
          'Follow-up automation is useful here not because the business wants to sound automated, but because it needs a reliable handoff from interest to action.'
        ]
      },
      {
        title: 'What businesses are actually automating',
        paragraphs: [
          'The most effective automation is usually simple. The moment a form is submitted, the lead is logged in a CRM or tracker. An acknowledgement goes out immediately so the prospect knows the message was received. The right person is alerted based on service type, area, or availability. A follow-up task is created automatically if nobody has replied within a defined window.',
          'None of that replaces the human conversation. It removes the uncertainty around whether the lead was seen, who owns it, and what happens if the first response does not go out quickly enough.',
          'That is an important distinction. Good automation supports service quality. Bad automation hides bad service behind templated messages. The first builds confidence. The second damages it.'
        ]
      },
      {
        title: 'Where the biggest gains come from',
        paragraphs: [
          'The first gain is response speed. Even if the full answer takes longer, an immediate acknowledgement and internal alert reduce the chance of a lead feeling ignored. The second gain is visibility. The business can actually see what is new, what has been contacted, and what needs attention.',
          'The third gain is consistency. When follow-up depends entirely on memory, good days and bad days produce completely different customer experiences. A system creates a baseline. Prospects stop being treated according to whoever happens to be least busy that afternoon.',
          'For founder-led businesses, the effect is especially noticeable because the founder often stops being the manual router for every incoming enquiry.'
        ]
      },
      {
        title: 'What to avoid',
        paragraphs: [
          'Do not start by building a complicated multi-step sequence if the basic lead process is still unclear. If the business does not know who should own a new lead, how quickly they should reply, or what information matters first, more automation will just move confusion around faster.',
          'Also avoid automations that create noise instead of action. If five people get notified every time a lead arrives, nobody truly owns it. If the CRM is full of stages the team does not understand, visibility gets worse rather than better.',
          'Automation should tighten the process, not blur it.'
        ]
      },
      {
        title: 'A practical first version',
        paragraphs: [
          'For many service businesses, a strong first version is enough to create immediate improvement. One intake point. One central record. One owner. One acknowledgement. One fallback reminder if no reply happens in time. That is usually far more effective than a large automation stack built too early.',
          'Once that baseline works, additional layers can be added sensibly: qualification rules, routing by service line, automatic task creation, or connection into scheduling and quoting. But those only work well when the first follow-up path is already clear.',
          'The goal is not to make the business feel automated. The goal is to stop letting valuable leads drift because the process is loose.'
        ]
      },
      {
        title: 'Why this matters now',
        paragraphs: [
          'Irish SMEs do not need enterprise lead management to improve follow-up. They need a reliable system that matches the size and pace of the team. When that system is in place, enquiries move faster, staff know what is happening, and customers get a more confident first impression.',
          'That is why good lead follow-up work often has an outsized impact. It touches revenue, operations, and customer experience at the same time.',
          'If enquiries are currently living in a shared inbox and follow-up depends on good intentions, there is almost certainly room for a better system.'
        ]
      }
    ]
  }
];
