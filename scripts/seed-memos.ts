import pool from "../src/lib/db";

async function seedMemos() {
  console.log("📄 Seeding sample memos...");

  try {
    // Get existing ministries and users
    const { rows: ministryRows } = await pool.query("SELECT id FROM ministries");
    const { rows: userRows } = await pool.query("SELECT id FROM users");

    if (ministryRows.length === 0 || userRows.length === 0) {
      console.warn("⚠️ Cannot seed memos — no ministries or users found.");
      process.exit(0);
    }

    const sampleMemos = [
      {
        title: "National Infrastructure Development Plan 2025",
        summary:
          "Proposal outlining the infrastructure priorities for FY 2025 including road expansion and urban transport upgrades.",
        body:
          "This memo presents the planned infrastructure initiatives focusing on rural connectivity, urban mass transit systems, and sustainable public works.",
        memo_type: "cabinet",
        priority: "high",
        status: "draft",
      },
      {
        title: "Youth Empowerment through Digital Skills Program",
        summary:
          "Framework for implementing a nationwide digital skills training program for youth and unemployed graduates.",
        body:
          "The memo seeks Cabinet approval to roll out a digital skills initiative in partnership with the private sector, targeting 200,000 youth.",
        memo_type: "committee",
        priority: "medium",
        status: "submitted",
      },
      {
        title: "Health Sector Preparedness and Emergency Response Plan",
        summary:
          "Comprehensive framework for improving emergency healthcare response capacity in all 47 counties.",
        body:
          "The Ministry of Health requests funding and logistical support for expanding emergency care and disease surveillance networks.",
        memo_type: "cabinet",
        priority: "urgent",
        status: "under_review",
      },
      {
        title: "Affordable Housing Project Implementation Update",
        summary:
          "Progress report and funding request for the ongoing affordable housing initiative across major urban centers.",
        body:
          "The memo outlines key milestones achieved and challenges in the rollout of affordable housing projects, proposing additional funding support.",
        memo_type: "information",
        priority: "medium",
        status: "approved",
      },
    ];

    for (const memo of sampleMemos) {
      const randomMinistry =
        ministryRows[Math.floor(Math.random() * ministryRows.length)];
      const randomUser = userRows[Math.floor(Math.random() * userRows.length)];

      await pool.query(
        `INSERT INTO gov_memos (title, summary, body, memo_type, priority, status, submitting_ministry_id, created_by, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          memo.title,
          memo.summary,
          memo.body,
          memo.memo_type,
          memo.priority,
          memo.status,
          randomMinistry.id,
          randomUser.id,
        ]
      );
    }

    console.log(`✅ ${sampleMemos.length} sample memos seeded successfully!`);
  } catch (error) {
    console.error("❌ Error seeding memos:", error);
  } finally {
    await pool.end();
  }
}

seedMemos();
