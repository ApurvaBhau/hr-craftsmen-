import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText, PenTool, Table2, Type, CalendarDays, RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const features = [
  { icon: FileText, title: "PDF Tools", description: "Edit, compress, merge, extract & e-sign documents directly in your browser." },
  { icon: PenTool, title: "Content Writer", description: "AI-powered content generation for offer letters, policies, and HR documents." },
  { icon: Table2, title: "Excel Formulas", description: "Describe what you need in plain English — get the perfect formula." },
  { icon: Type, title: "Word Formatting", description: "Professional, Basic & Content formatting modes with instant preview." },
  { icon: CalendarDays, title: "Event Scheduler", description: "Plan and manage events with calendar views and smart exports." },
  { icon: RefreshCw, title: "File Converter", description: "Convert between PDF, Word, Excel, and image formats seamlessly." },
];

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.5 } },
});

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-xs font-display">WS</span>
            </div>
            <span className="font-bold text-lg font-display tracking-tight">WorkSuite</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">
                Get Started <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        {/* Abstract background SVG illustration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <svg className="absolute -right-40 -top-20 w-[700px] h-[700px] opacity-[0.04] dark:opacity-[0.06]" viewBox="0 0 600 600" fill="none">
            <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="220" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="160" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="100" stroke="currentColor" strokeWidth="0.5" />
            <line x1="20" y1="300" x2="580" y2="300" stroke="currentColor" strokeWidth="0.5" />
            <line x1="300" y1="20" x2="300" y2="580" stroke="currentColor" strokeWidth="0.5" />
            <line x1="98" y1="98" x2="502" y2="502" stroke="currentColor" strokeWidth="0.5" />
            <line x1="502" y1="98" x2="98" y2="502" stroke="currentColor" strokeWidth="0.5" />
          </svg>
          <svg className="absolute -left-32 bottom-0 w-[500px] h-[500px] opacity-[0.03] dark:opacity-[0.05]" viewBox="0 0 400 400" fill="none">
            <rect x="40" y="40" width="320" height="320" rx="16" stroke="currentColor" strokeWidth="0.5" />
            <rect x="80" y="80" width="240" height="240" rx="12" stroke="currentColor" strokeWidth="0.5" />
            <rect x="120" y="120" width="160" height="160" rx="8" stroke="currentColor" strokeWidth="0.5" />
            <rect x="160" y="160" width="80" height="80" rx="4" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Floating accent dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-32 left-[12%] w-2 h-2 rounded-full bg-accent/20" />
          <div className="absolute top-48 right-[18%] w-1.5 h-1.5 rounded-full bg-accent/15" />
          <div className="absolute bottom-24 left-[22%] w-1 h-1 rounded-full bg-accent/25" />
          <div className="absolute top-20 right-[30%] w-2.5 h-2.5 rounded-full bg-foreground/5" />
          <div className="absolute bottom-32 right-[12%] w-2 h-2 rounded-full bg-foreground/5" />
        </motion.div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-xs font-medium text-muted-foreground mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Trusted productivity platform for modern teams
          </motion.div>

          <motion.h1
            variants={fadeUp(0.1)}
            initial="hidden"
            animate="visible"
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display tracking-tight leading-[1.1] mb-5"
          >
            All your productivity
            <br />
            tools in <span className="text-accent">one place</span>
          </motion.h1>

          <motion.p
            variants={fadeUp(0.2)}
            initial="hidden"
            animate="visible"
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
          >
            Six powerful tools — PDF editing, AI content writing, formula generation, document formatting, scheduling, and file conversion — all running securely in your browser.
          </motion.p>

          <motion.div
            variants={fadeUp(0.3)}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/login">
              <Button size="lg" className="px-8 h-11 text-sm font-semibold">
                Open Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="px-8 h-11 text-sm font-semibold">
                See Features
              </Button>
            </a>
          </motion.div>
        </div>
      </section>


      {/* ─── Features ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3">
              Everything your team needs
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Professional-grade tools designed for productivity, built with privacy at the core.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={cardItem}
                className="group rounded-xl border border-border bg-card p-6 hover:shadow-md hover:border-accent/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold font-display mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-[8px] font-display">WS</span>
            </div>
            <span className="font-display font-semibold text-foreground">WorkSuite</span>
          </div>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
