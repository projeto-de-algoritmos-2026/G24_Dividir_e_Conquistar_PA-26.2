import { Navigation2 } from "lucide-react";
import { VIEWS, type ViewId } from "./navigation";

const SECTIONS = [
  { id: "operations", caption: "OPERAÇÕES" },

] as const;

export function Sidebar({ activeView, onNavigate }: { activeView: ViewId; onNavigate: (view: ViewId) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Navigation2 size={23} fill="currentColor" />
        </div>
        <div>
          <strong>
            AERIS<span className="brand-period">.</span>
          </strong>
          <small>AIRSPACE INTELLIGENCE</small>
        </div>
      </div>
      {SECTIONS.map((section) => (
        <div key={section.id} className="nav-group">
          <div className="section-caption">{section.caption}</div>
          <nav>
            {VIEWS.filter((view) => view.section === section.id).map(({ id, label, icon: Icon }) => (
              <button key={id} className={activeView === id ? "active" : ""} onClick={() => onNavigate(id)}>
                <Icon size={17} /> {label}
              </button>
            ))}
          </nav>
        </div>
      ))}
      <div className="side-bottom">
        <div className="side-version">AERIS</div>
      </div>
    </aside>
  );
}



