import ffmpeg from "ffmpeg-static";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const assets = fileURLToPath(new URL("../assets/cases/", import.meta.url));
const output = fileURLToPath(new URL("../assets/videos/", import.meta.url));
const font = "/System/Library/Fonts/Supplemental/Arial.ttf";

const videos = [
  {
    name: "crm-walkthrough.mp4",
    frames: [
      ["crm-pipeline-desktop.png", "See every inquiry and its next stage"],
      ["crm-new-lead.png", "Capture the company, contact, and actual need"],
      ["crm-qualification.png", "Require the facts needed before conversion"],
      ["crm-deals-desktop.png", "Keep deal stage and next commitment visible"],
      ["crm-tasks-desktop.png", "Create follow-up in the same customer context"],
      ["crm-pipeline-mobile.png", "Use the workflow on mobile without losing clarity"]
    ]
  },
  {
    name: "erp-walkthrough.mp4",
    frames: [
      ["erp-inventory-desktop.png", "Connect summary, inventory, and exceptions"],
      ["erp-summary.png", "Put operational totals in one accountable view"],
      ["erp-table.png", "Preserve location and category context"],
      ["erp-exception.png", "Show the exception before the full table"],
      ["erp-inventory-light.png", "Keep the information hierarchy in both themes"],
      ["erp-inventory-mobile.png", "Carry the operational view to mobile"]
    ]
  },
  {
    name: "map-walkthrough.mp4",
    frames: [
      ["map-desktop.png", "See regional coverage instead of a flat list"],
      ["map-region-card.png", "Open a region without leaving the map context"],
      ["map-mixed-region.png", "Separate location stages with semantic color"],
      ["map-region-zoom.png", "Move from national view to local detail"],
      ["map-city-card.png", "Keep the selected city record visible"],
      ["map-mobile.png", "Preserve search and navigation on mobile"]
    ]
  }
];

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ["ignore", "inherit", "inherit"] });
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
  });
}

for (const video of videos) {
  const inputs = video.frames.flatMap(([file]) => ["-loop", "1", "-t", "10", "-i", `${assets}/${file}`]);
  const filters = video.frames.map(([, caption], index) => {
    const safeCaption = caption.replace(/:/g, "\\:").replace(/'/g, "\\'");
    return `[${index}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x0c0e0d,fps=24,drawbox=x=0:y=610:w=1280:h=110:color=0x0c0e0d@0.88:t=fill,drawtext=fontfile=${font}:text='${safeCaption}':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=647,fade=t=in:st=0:d=0.45,fade=t=out:st=9.55:d=0.45,setpts=PTS-STARTPTS[v${index}]`;
  });
  const labels = video.frames.map((_, index) => `[v${index}]`).join("");
  filters.push(`${labels}concat=n=${video.frames.length}:v=1:a=0[outv]`);
  await run([
    "-y", ...inputs,
    "-filter_complex", filters.join(";"),
    "-map", "[outv]",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "27", "-preset", "medium", "-movflags", "+faststart",
    `${output}/${video.name}`
  ]);
  console.log(`Built ${video.name}`);
}
