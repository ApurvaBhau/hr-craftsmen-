import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText, PenTool, Table2, Type, CalendarDays, RefreshCw, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const tools = [
  { title: "PDF Tools", description: "Edit, compress, merge, extract & e-sign PDFs.", icon: FileText, href: "/pdf-tools", colorVar: "--tool-pdf" },
  { title: "Content Writer", description: "AI-powered HR content generation.", icon: PenTool, href: "/content-writer", colorVar: "--tool-content" },
  { title: "Excel Formula", description: "Natural language to spreadsheet formulas.", icon: Table2, href: "/excel-formula", colorVar: "--tool-excel" },
  { title: "Word Formatting", description: "Professional document formatting.", icon: Type, href: "/word-formatting", colorVar: "--tool-word" },
  { title: "Event Schedule", description: "Calendar views and smart exports.", icon: CalendarDays, href: "/event-schedule", colorVar: "--tool-events" },
  { title: "File Converter", description: "Convert between file formats.", icon: RefreshCw, href: "/file-converter", colorVar: "--tool-files" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight font-display">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select a tool to get started
        </p>
      </motion.div>

      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {tools.map((tool) => (
          <motion.div key={tool.title} variants={item}>
            <Link to={tool.href}>
              <div className="group rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-accent/30 transition-all duration-300 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `hsl(var(${tool.colorVar}) / 0.1)` }}
                  >
                    <tool.icon className="h-5 w-5" style={{ color: `hsl(var(${tool.colorVar}))` }} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold font-display text-sm mb-1">{tool.title}</h3>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
