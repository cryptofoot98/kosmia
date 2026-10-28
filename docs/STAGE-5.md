# Stage 5 — Kassandra, profile and onboarding

The reference boards are `docs/mockups/onboarding.webp`, plus Kassandra in `overview.webp`. Each screen has a mockup / before / after image in `docs/review/stage5-<screen>.webp`. The welcome is checked at 390×844 and 320×640.

## Onboarding

The steps are now welcome, intro, sign, confirm, (account), details, notifications and ready. The order of navy and parchment screens follows the mockups.

- **Welcome** (new painting `ob-welcome`): the engraved sun, the crescent, the KOSMIA wordmark in the open sky with "Your cosmic guide for a more aligned you", the coast below, and Begin Your Journey. Sign in is still offered when accounts are on.
- **Introduction** (new step): "Ancient Wisdom for Modern Life", the portrait of the woman before the moon, and six features as a quiet engraved list.
- **Sign**: the twelve new creature medallions (`zm-<sign>`) in a grid of three:
  - ram, bull, twins, crab, lion, maiden, scales, scorpion, centaur, sea-goat, water bearer and fish
  - real radio buttons with labels and dates, and a lit selected state
  - "Not sure of your sign?" still sets the sign from a birthday.
- **Confirmation**: unchanged. The sign's own framed plate, "Yes, continue" and "Choose a different sign".
- **Account**: unchanged. Same form, same strength rules, same sign-up and sign-in. A successful sign-up now leads to the details step instead of straight to the end.
- **Details** (new step, optional):
  - Fields: name, date of birth, time of birth, and place, using the app's existing place search.
  - The date must be real and not in the future.
  - When accounts are on, the existing consent box asks before birth details are kept in the account.
  - "I'll add this later" skips the step. Nothing is saved unless it is given.
- **Notifications** (new step): three parchment switch rows (Daily horoscope, Celestial events, Daily Whisper) stored in the existing notification preferences. As in Settings, it says plainly that reminders start once notifications launch and that the browser will ask permission first.
- **Ready** (new painting `ob-final`): the moon over the lake, "Welcome to Kosmia", "The universe is always speaking. Now, you can listen.", the chosen sign's medallion, and Start Exploring.

People who have already onboarded are not affected. With a sign already saved, the app opens straight on Home, as the flow test confirms.

## Kassandra

- The existing portrait (red headscarf, coin headdress, gold jewellery) now sits in an engraved celestial ring with twelve gold stars, on parchment.
- Below it are the speech bubble, the large round microphone, the three suggested questions and the written input.
- Signed out, the microphone and the questions lead to signing in, and the page says why: Kassandra's readings come from AI, so she listens once you are signed in.
- Voice, text, history and new conversations are unchanged.

## Profile

- The plain account banner is now a personalised scene: the reader's own sign figure before its golden moon in the night garden (the same layers as Home).
- Beside it is a gilt parchment identity card: name, glyph, sign and dates, keywords, element, modality and ruler, and birth date and place when known.
- Profile editing, birth details, saved items, preferences, settings and account management are unchanged below it.

## Assets

New paintings (14, about $2): `ob-welcome`, `ob-final` and `zm-<sign>` ×12. Everything else reuses existing art: `welcome`, `kassandra`, `home-sky`, `home-halo`, `fg-<sign>` and `ce-vignette`.

## Checked

- **Onboarding flow, end to end**: a future date is rejected with a message; name, birth date and time are saved; the notification choices are saved; entering the app works; a returning user goes straight in.
- **Regression**: all 40 screens show no errors and no horizontal overflow; the flow test is updated for the new steps and passes.
