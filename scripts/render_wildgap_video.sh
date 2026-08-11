#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FFMPEG_BIN="${WILDGAP_FFMPEG_BIN:-$(command -v ffmpeg || true)}"

if [[ -z "$FFMPEG_BIN" ]]; then
  echo "Set WILDGAP_FFMPEG_BIN to an ffmpeg binary or install ffmpeg." >&2
  exit 1
fi

WORK_DIR="$(mktemp -d /tmp/wildgap-final-video.XXXXXX)"
trap 'rm -rf "$WORK_DIR"' EXIT

OUT_DIR="$ROOT_DIR/docs/assets/video"
VOICE_FILE="$WORK_DIR/narration.aiff"
PICTURE_FILE="$WORK_DIR/picture.mp4"
ARCH_DIR="$WORK_DIR/architecture"
mkdir -p "$ARCH_DIR"

say -v Samantha -r 260 -f "$OUT_DIR/narration-final.txt" -o "$VOICE_FILE"
sips -s format png "$ROOT_DIR/docs/assets/architecture.svg" --out "$ARCH_DIR/architecture.png" >/dev/null
ARCH_PNG="$ARCH_DIR/architecture.png"

render_shot() {
  local index="$1"
  local source="$2"
  local seconds="$3"
  local framing="$4"
  local frames
  frames="$(python3 -c "print(round(float('$seconds') * 30))")"

  "$FFMPEG_BIN" -hide_banner -loglevel error -i "$source" \
    -vf "$framing,zoompan=z='min(max(zoom,pzoom)+0.0007,1.075)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$frames:s=1920x1080:fps=30,format=yuv420p,setsar=1" \
    -frames:v "$frames" -an -c:v libx264 -preset medium -crf 18 -r 30 \
    "$WORK_DIR/shot-$(printf '%02d' "$index").mp4" -y
}

LANDSCAPE="scale=1920:1200:force_original_aspect_ratio=increase,crop=1920:1080"
SOCIAL="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x143f35"
LEFT_DETAIL="crop=820:690:0:55,scale=1920:1080"
MAP_DETAIL="crop=760:650:390:95,scale=1920:1080"
RIGHT_DETAIL="crop=510:690:770:55,scale=1920:1080"
MISSION_DETAIL="crop=900:620:190:90,scale=1920:1080"
MOBILE="scale=-1:1030,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x143f35"
ARCH="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xf6f0e4"

render_shot 1 "$ROOT_DIR/docs/assets/social-card.png" 4.0 "$SOCIAL"
render_shot 2 "$ROOT_DIR/docs/assets/screenshots/home-desktop.png" 3.4 "$LANDSCAPE"
render_shot 3 "$ROOT_DIR/docs/assets/screenshots/home-desktop.png" 3.3 "$LEFT_DETAIL"
render_shot 4 "$ROOT_DIR/docs/assets/screenshots/home-desktop.png" 3.2 "$RIGHT_DETAIL"
render_shot 5 "$ROOT_DIR/docs/assets/screenshots/explorer-desktop.png" 4.0 "$LANDSCAPE"
render_shot 6 "$ROOT_DIR/docs/assets/screenshots/explorer-desktop.png" 3.4 "$LEFT_DETAIL"
render_shot 7 "$ROOT_DIR/docs/assets/screenshots/explorer-desktop.png" 3.4 "$MAP_DETAIL"
render_shot 8 "$ROOT_DIR/docs/assets/screenshots/explorer-desktop.png" 3.4 "$RIGHT_DETAIL"
render_shot 9 "$ROOT_DIR/docs/assets/screenshots/explorer-desktop.png" 3.6 "$RIGHT_DETAIL"
render_shot 10 "$ROOT_DIR/docs/assets/screenshots/explorer-mobile.png" 4.0 "$MOBILE"
render_shot 11 "$ROOT_DIR/docs/assets/screenshots/mission-desktop.png" 3.5 "$LANDSCAPE"
render_shot 12 "$ROOT_DIR/docs/assets/screenshots/mission-desktop.png" 3.5 "$MISSION_DETAIL"
render_shot 13 "$ROOT_DIR/docs/audit/13-mission-protocol-after.png" 3.5 "$LANDSCAPE"
render_shot 14 "$ROOT_DIR/docs/audit/14-mission-complete-after.png" 3.5 "$LANDSCAPE"
render_shot 15 "$ROOT_DIR/docs/assets/screenshots/mission-mobile.png" 3.5 "$MOBILE"
render_shot 16 "$ROOT_DIR/docs/assets/screenshots/explorer-desktop.png" 3.5 "$MAP_DETAIL"
render_shot 17 "$ARCH_PNG" 4.0 "$ARCH"
render_shot 18 "$ROOT_DIR/docs/assets/screenshots/home-desktop.png" 4.0 "$LANDSCAPE"
render_shot 19 "$ROOT_DIR/docs/assets/social-card.png" 1.3 "$SOCIAL"

for shot in "$WORK_DIR"/shot-*.mp4; do
  printf "file '%s'\n" "$shot" >> "$WORK_DIR/concat.txt"
done

"$FFMPEG_BIN" -hide_banner -loglevel error -f concat -safe 0 -i "$WORK_DIR/concat.txt" -c copy "$PICTURE_FILE" -y

"$FFMPEG_BIN" -hide_banner -loglevel error \
  -i "$PICTURE_FILE" -i "$VOICE_FILE" \
  -f lavfi -t 66 -i "aevalsrc=0.14*sin(2*PI*110*t)+0.09*sin(2*PI*164.81*t)+0.05*sin(2*PI*220*t):s=48000" \
  -filter_complex "[2:a]volume=0.10,afade=t=in:st=0:d=2,afade=t=out:st=62:d=4[pad];[1:a]volume=1.0[voice];[voice][pad]amix=inputs=2:duration=longest:dropout_transition=2,alimiter=limit=0.95[a];[0:v]subtitles='$OUT_DIR/captions-final.srt':force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00F7F2E8,OutlineColour=&HCC143F35,BorderStyle=3,Outline=1,Shadow=0,MarginV=42,Alignment=2'[v]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 18 -r 30 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -ar 48000 -movflags +faststart -t 66 \
  "$OUT_DIR/wildgap-final.mp4" -y

"$FFMPEG_BIN" -hide_banner -loglevel error -i "$OUT_DIR/wildgap-final.mp4" \
  -vf "fps=1/7.3,scale=384:-1,tile=3x3" -frames:v 1 -update 1 \
  "$OUT_DIR/wildgap-final-contact-sheet.png" -y

echo "Rendered $OUT_DIR/wildgap-final.mp4"
