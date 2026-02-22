# AI Book Factory

AI-powered personalized book generation via Claude CLI. Generate comprehensive, deeply personalized books on any topic — tailored to your background, interests, and learning style.

## How It Works

1. **You tell it who you are** — role, interests, goals, and an open-ended profile
2. **You pick a topic** — or let AI recommend one
3. **Claude generates a full book** — 3,000 to 25,000+ words depending on template, with real research, named theories, practical frameworks, and exercises
4. **Output in HTML/PDF** — styled, self-contained files ready to read or share

## Quick Start

```bash
# Install
npm install -g ai-book-factory

# Set up your profile
bookfactory init

# Preview what a generation prompt looks like
bookfactory generate "Game Theory" --dry-run

# Generate a book
bookfactory generate "Game Theory"

# Generate with a specific template
bookfactory generate "React Performance" --template deep-dive
```

## Commands

| Command | Description |
|---------|-------------|
| `bookfactory init` | Interactive setup — profile, interests, preferences |
| `bookfactory generate <topic>` | Generate a book on a topic |
| `bookfactory generate --dry-run` | Preview the assembled prompt |
| `bookfactory topics list` | Show your topic backlog |
| `bookfactory topics add "Topic"` | Add a topic to the backlog |
| `bookfactory topics recommend` | Get AI topic recommendations |
| `bookfactory config` | Show current configuration |
| `bookfactory history` | Show generation history |
| `bookfactory deliver <file> --via email` | Send a book via email/telegram |

## Templates

| Template | Words | Best For |
|----------|-------|----------|
| `comprehensive` (default) | 8-12K | Most topics — balanced depth and breadth |
| `deep-dive` | 15-25K | Topics you want to master completely |
| `quick-read` | 3-5K | Quick surveys of new areas |
| `practical-guide` | 10-15K | Skills where doing > knowing |

Custom templates: create YAML files in `~/.config/bookfactory/templates/`.

## The Open Profile

The most powerful feature. During `bookfactory init`, you write a free-form description of yourself — your background, what you're working on, challenges you face, how you think. This text is injected verbatim into every generation prompt, making every book deeply personalized to you.

## Configuration

All config lives in `~/.config/bookfactory/`:

- `config.yaml` — generation settings (language, template, output format, delivery)
- `profile.yaml` — your identity, interests, goals, open profile

Books are saved to `~/.local/share/bookfactory/books/`.

Sensitive values (API keys, passwords) use environment variables:
- `BOOKFACTORY_EMAIL_PASSWORD` — for email delivery
- `BOOKFACTORY_TELEGRAM_TOKEN` — for Telegram delivery

## Prerequisites

- **Node.js** >= 18
- **Claude CLI** (`npm install -g @anthropic-ai/claude-code`) — required
- **pandoc** — optional, for high-quality MD→HTML conversion
- **Chrome/Chromium** — optional, for PDF generation

## Delivery Channels

- **local** (default) — save to disk
- **email** — SMTP-based, attach HTML/PDF
- **telegram** — send via Telegram bot

Configure in `~/.config/bookfactory/config.yaml` under `delivery.channels`.

## Architecture

```
bin/bookfactory.ts     CLI entry point (commander)
src/
  cli/                 Command implementations
  core/
    prompt-builder.ts  Assembles 8-component generation prompt
    claude-runner.ts   Invokes Claude CLI with lock file + retry
  profile/             Config & profile schemas + management
  templates/           Template system + 4 built-in templates
  delivery/            Plugin-based delivery (local, email, telegram)
  format/              MD→HTML→PDF conversion pipeline
  utils/               Logger, constants, prerequisites checker
```

## License

MIT
