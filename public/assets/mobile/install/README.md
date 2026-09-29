# Install guide screenshots

`components/game/InstallGuidePanel.tsx` looks for these three files, in this
order, and shows each step's text with the screenshot above it:

| file                  | what to capture                               |
| --------------------- | --------------------------------------------- |
| `step-1-share.png`    | Safari's share button in the toolbar          |
| `step-2-add-home.png` | the share sheet with "홈 화면에 추가" visible |
| `step-3-launch.png`   | the finished icon on the home screen          |

Any file that is missing is simply not rendered — the guide still reads
correctly with text alone, and nothing shows a broken image. Landscape crops
around 800px wide look best; the panel scales them down to fit.
