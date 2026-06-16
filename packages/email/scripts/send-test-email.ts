import { getSharedEnv } from "@fleet/config";
import { enqueueEmail } from "@fleet/queue";
import { sendLoginEmail, sendSignupEmail } from "../src/send";

type EmailType = "signup" | "login";

function printUsage(): void {
  console.log(`Send a test auth email via Resend.

Usage:
  bun run test:email <signup|login> --to <email> [--name <name>] [--sync]

Options:
  --to <email>    Recipient address (required)
  --name <name>   Recipient display name (default: "Test User")
  --sync          Send directly via Resend (default: enqueue via BullMQ worker)

Examples:
  bun run test:email signup --to you@example.com
  bun run test:email login  --to you@example.com --name Alex --sync
`);
}

function parseArgs(argv: string[]): {
  type: EmailType | null;
  to: string | undefined;
  name: string;
  sync: boolean;
} {
  const type = argv[0] === "signup" || argv[0] === "login" ? argv[0] : null;
  let to: string | undefined;
  let name = "Test User";
  let sync = false;

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--to") {
      to = argv[++i] ?? to;
      continue;
    }
    if (arg === "--name") {
      name = argv[++i] ?? name;
      continue;
    }
    if (arg === "--sync") {
      sync = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return { type, to, name, sync };
}

async function main(): Promise<void> {
  const { type, to, name, sync } = parseArgs(process.argv.slice(2));

  if (!type) {
    console.error("Error: email type must be 'signup' or 'login'\n");
    printUsage();
    process.exit(1);
  }

  if (!to) {
    console.error("Error: --to <email> is required\n");
    printUsage();
    process.exit(1);
  }

  const env = getSharedEnv();

  console.log(`Sending ${type} email (${sync ? "sync via Resend" : "enqueue via BullMQ"})...`);
  console.log(`  from: ${env.RESEND_FROM_EMAIL}`);
  console.log(`  to:   ${to}`);
  console.log(`  name: ${name}`);
  console.log(`  dashboard: ${env.DASHBOARD_URL}`);

  if (sync) {
    switch (type) {
      case "signup":
        await sendSignupEmail({ to, name });
        break;
      case "login":
        await sendLoginEmail({ to, name });
        break;
      default: {
        const unexpected: never = type;
        throw new Error(`Unhandled email type: ${unexpected}`);
      }
    }
    console.log("Email sent successfully.");
  } else {
    await enqueueEmail({ type, to, name });
    console.log("Job enqueued. Email will be sent when the worker processes it.");
    console.log("Tip: use --sync to send immediately (useful for template debugging).");
    process.exit(0);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Failed:", message);
  process.exit(1);
});
