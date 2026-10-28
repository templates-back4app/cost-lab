# cost-lab

[![Deploy on Back4app](https://img.shields.io/badge/Deploy%20on-Back4app-1568B8?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJMMiA3djEwbDEwIDUgMTAtNVY3eiIvPjwvc3ZnPg==)](https://www.back4app.com/signup?utm_source=github&utm_medium=repo&utm_campaign=cost-lab)

The same feature — accounts, sign-in, and private notes only their owner can read,
edit or delete — built twice. Both are held to the same eleven acceptance checks,
and only then counted, with a real tokenizer rather than a guess.

> **Read the article:** [Where Your AI Credits Go: 78% of the Tokens Buy Code Every App Already Has](https://www.back4app.com/blog/where-ai-credits-go-token-count?utm_source=github&utm_medium=repo&utm_campaign=cost-lab)

## Run it

```
./run.sh
```

Needs Docker, Node 22 and one npm dependency (`gpt-tokenizer`).

## What it found

Both versions pass **11 of 11** acceptance checks, including every ownership rule.

| | writing the backend yourself | on a backend that exists |
| --- | --- | --- |
| files you own | 4 | 2 |
| lines you own | 121 | 27 |
| **tokens you own** | **1,554** | **332** |
| of that, the part every app has | 1,214 (78%) | 332 (100%) |

**4.7x less code to produce and maintain**, for an identical, identically-tested
feature.

### What this number is, and is not

It counts the artifact, not the conversation. The tokens actually spent are a
multiple of this — prompts, reasoning, failed attempts, and the file being re-read
on every edit — and that multiple depends on the tool. What the count does show is
*what the spend is on*: 78% of the file in the hand-written version is the part
that is identical in every application ever built.

It is also conservative. The from-scratch version here is compact and correct. A
generated one is usually longer.

## And what happens when that code is slightly wrong

Four ordinary mistakes, each applied to a copy and run through the same battery:

```
the mistake                       caught by the battery?
password compared with ===        NO — all 11 checks still pass
session token from Math.random()  NO — all 11 checks still pass
no ownership check when reading   yes — "you cannot open someone else's note by id"
no ownership check when deleting  yes — "you cannot delete someone else's note"
```

**Two of the four ship.** Both of those two are security flaws: a password
comparison that leaks timing, and session tokens anyone can predict. None of the
four is possible in the version that does not write this code.

## The pieces

| file | what it does |
| --- | --- |
| `from-scratch/` | the backend written by hand: db, auth, server, feature |
| `on-a-backend/` | the same feature as a schema, permissions and an ownership trigger |
| `verify/acceptance.mjs` | the eleven checks, run against both through adapters |
| `count.mjs` | the token count, by file, split into infrastructure and your product |
| `slips.mjs` | four ordinary mistakes, and which ones the tests notice |
