import { Workspace } from "../workspace/workspace";
import "../workspace/workspace.css";

export const metadata = { title: "How Hunch is built", description: "The build, distribution architecture, and roadmap for Hunch." };

export default function BuildPage() {
  return <div className="jw"><Workspace initialView="Build" /></div>;
}
