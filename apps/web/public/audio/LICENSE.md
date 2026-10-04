# Audio license

Every sound in `sfx.wav` is original. The file is synthesized from scratch (sine and square oscillators, seeded noise, envelopes) by `apps/web/scripts/make-sfx.mjs`; no samples or recordings from any other source are used.

The sounds are released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). To the extent possible under law, the Bomb Appetit authors have waived all copyright and related rights to them. You may copy, modify, and use them for any purpose without asking permission or giving credit.

To regenerate the file, run `pnpm sfx:build` in `apps/web`. The output is deterministic.
