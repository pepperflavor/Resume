# Install guide screenshots

`components/game/InstallGuidePanel.tsx` picks one of these sets from the
device's platform and shows each step's text with its screenshot underneath.

## `ios/`

| file                  | what to capture                               |
| --------------------- | --------------------------------------------- |
| `step-1-share.png`    | Safari's share button in the toolbar          |
| `step-2-add-home.png` | the share sheet with "홈 화면에 추가" visible |
| `step-3-launch.png`   | the finished icon on the home screen          |

## `android/`

| file                  | what to capture                                    |
| --------------------- | -------------------------------------------------- |
| `step-1-menu.png`     | Chrome's ⋮ menu button                             |
| `step-2-add-home.png` | the menu with "홈 화면에 추가" / "앱 설치" visible |
| `step-3-launch.png`   | the finished icon on the home screen               |

The `other` guide deliberately ships no screenshots: it is shown when the
browser could be anything, so a picture of one browser would mislead.

Any file that is missing is simply not rendered — the guide still reads
correctly on its text alone, and nothing shows a broken image. Landscape crops
around 800px wide look best; the panel scales them down to fit.
