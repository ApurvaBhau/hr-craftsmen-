import { useState, useEffect } from "react";
import {
  Plus,
  CalendarDays,
  List,
  MapPin,
  Clock,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { isSameMonth } from "date-fns";

interface HREvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  type: "training" | "engagement" | "townhall";
}

const eventTypeStyles: Record<string, { bg: string; text: string; label: string }> = {
  training: {
    bg: "hsl(var(--tool-word) / 0.1)",
    text: "hsl(var(--tool-word))",
    label: "Training",
  },
  engagement: {
    bg: "hsl(var(--tool-excel) / 0.1)",
    text: "hsl(var(--tool-excel))",
    label: "Engagement",
  },
  townhall: {
    bg: "hsl(var(--tool-content) / 0.1)",
    text: "hsl(var(--tool-content))",
    label: "Town Hall",
  },
};

const emptyForm = {
  title: "",
  date: "",
  time: "",
  venue: "",
  description: "",
  type: "training",
};

export default function EventSchedule() {
  const [events, setEvents] = useState<HREvent[]>(() => {
    const saved = localStorage.getItem("worksuite-events");
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<string>("list");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem("worksuite-events", JSON.stringify(events));
  }, [events]);

  const handleCreate = () => {
    if (!form.title || !form.date) {
      toast.error("Title and date are required");
      return;
    }
    const event: HREvent = {
      ...form,
      id: Date.now().toString(),
      type: form.type as HREvent["type"],
    };
    setEvents((prev) =>
      [...prev, event].sort((a, b) => a.date.localeCompare(b.date))
    );
    setForm(emptyForm);
    setDialogOpen(false);
    toast.success("Event created!");
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Event deleted");
  };

  const handleExport = () => {
    const csv = [
      "Title,Date,Time,Venue,Type,Description",
      ...events.map(
        (e) =>
          `"${e.title}","${e.date}","${e.time}","${e.venue}","${eventTypeStyles[e.type].label}","${e.description}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "events.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Events exported");
  };

  const filteredEvents =
    view === "calendar"
      ? events.filter((e) => isSameMonth(new Date(e.date), selectedDate))
      : events;

  const eventDates = events.map((e) => new Date(e.date));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Event Schedule</h1>
          <p className="text-muted-foreground">Manage HR events and activities</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={events.length === 0}
          >
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, date: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, time: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={form.venue}
                    onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
                    placeholder="Location"
                  />
                </div>
                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="townhall">Town Hall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Event details..."
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v)}
        >
          <ToggleGroupItem value="list">
            <List className="h-4 w-4 mr-1" /> List
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar">
            <CalendarDays className="h-4 w-4 mr-1" /> Calendar
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "calendar" && (
        <div className="flex justify-center mb-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            modifiers={{ hasEvent: eventDates }}
            modifiersClassNames={{
              hasEvent: "bg-primary/20 font-bold",
            }}
          />
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {events.length === 0
              ? "No events yet. Create your first event to get started."
              : "No events this month."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const style = eventTypeStyles[event.type];
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                        }}
                      >
                        {style.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {event.date}
                      </span>
                      {event.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {event.time}
                        </span>
                      )}
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {event.venue}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(event.id)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
