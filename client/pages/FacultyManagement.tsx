import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Plus, Search, Edit, Trash2, Clock, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// NOTE: The following types are illustrative. You should define them based on your actual API response.
// It's a good practice to have a shared types folder for frontend and backend.
interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface Faculty {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  skills: Skill[];
  availability: { day_of_week: string; start_time: string; end_time: string }[];
}


const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

type WeeklySchedule = Record<typeof DAYS_OF_WEEK[number], DaySchedule>;

const createEmptyWeeklySchedule = (): WeeklySchedule => {
  return DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = { isAvailable: false, timeSlots: [] };
    return acc;
  }, {} as WeeklySchedule);
};


interface TimeSlotEditorProps {
  timeSlots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
}

function TimeSlotEditor({ timeSlots, onChange }: TimeSlotEditorProps) {
  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updated = timeSlots.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    onChange(updated);
  };

  // Assuming we now only manage a single time slot
  const singleSlot = timeSlots[0] || { startTime: '10:00', endTime: '20:00' };

  return (
    <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={singleSlot.startTime}
            onChange={(e) => updateTimeSlot(0, "startTime", e.target.value)}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="time"
            value={singleSlot.endTime}
            onChange={(e) => updateTimeSlot(0, "endTime", e.target.value)}
            className="w-32"
          />
        </div>
    </div>
  );
}

interface ScheduleEditorProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  const updateDaySchedule = (day: keyof WeeklySchedule, daySchedule: DaySchedule) => {
    onChange({ ...schedule, [day]: daySchedule });
  };

  return (
    <div className="space-y-4 w-full">
      <Label className="text-base font-medium">Weekly Schedule</Label>
      <Tabs defaultValue="monday" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {DAYS_OF_WEEK.map((day) => (
            <TabsTrigger key={day} value={day}>
              {day.charAt(0).toUpperCase() + day.slice(1, 3)}
            </TabsTrigger>
          ))}
        </TabsList>
        {DAYS_OF_WEEK.map((day) => (
          <TabsContent key={day} value={day} className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium capitalize">{day}</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor={`${day}-available`} className="text-sm">Available</Label>
                <Switch
                  id={`${day}-available`}
                  checked={schedule[day].isAvailable}
                  onCheckedChange={(checked) => {
                    const newDaySchedule = { ...schedule[day], isAvailable: checked };
                    if (checked && newDaySchedule.timeSlots.length === 0) {
                      newDaySchedule.timeSlots = [{ startTime: "10:00", endTime: "20:00" }];
                    }
                    updateDaySchedule(day, newDaySchedule);
                  }}
                />
              </div>
            </div>
            {schedule[day].isAvailable && (
              <TimeSlotEditor
                timeSlots={schedule[day].timeSlots}
                onChange={(timeSlots) =>
                  updateDaySchedule(day, { ...schedule[day], timeSlots })
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface FacultyFormData {
  name: string;
  email: string;
  phone: string;
  skillIds: string[];
  schedule: WeeklySchedule;
}

interface FacultyDialogProps {
  faculty?: Faculty;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FacultyFormData) => void;
  skills: Skill[];
}

function FacultyDialog({ faculty, open, onOpenChange, onSave, skills }: FacultyDialogProps) {
  const [formData, setFormData] = useState<FacultyFormData>({
    name: "",
    email: "",
    phone: "",
    skillIds: [],
    schedule: createEmptyWeeklySchedule(),
  });

  useEffect(() => {
    if (open && faculty) {
      const fetchAvailability = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/availability/faculty/${faculty.id}`);
          if (!response.ok) throw new Error('Failed to fetch availability');
          const availabilityData = await response.json();
          const newSchedule = createEmptyWeeklySchedule();
          availabilityData.forEach((slot: any) => {
            const day = slot.day_of_week.toLowerCase();
            if (newSchedule[day]) {
              newSchedule[day].isAvailable = true;
              newSchedule[day].timeSlots.push({ startTime: slot.start_time, endTime: slot.end_time });
            }
          });

          setFormData({
            name: faculty.name,
            email: faculty.email,
            phone: faculty.phone_number || "",
            skillIds: faculty.skills.map(s => s.id),
            schedule: newSchedule,
          });

        } catch (error) {
          console.error("Error fetching faculty availability:", error);
          // Fallback to basic info with empty schedule
          setFormData({
            name: faculty.name,
            email: faculty.email,
            phone: faculty.phone_number || "",
            skillIds: faculty.skills.map(s => s.id),
            schedule: createEmptyWeeklySchedule(),
          });
        }
      };
      fetchAvailability();
    } else if (open) {
      // Reset form for adding a new faculty member
      setFormData({
        name: "",
        email: "",
        phone: "",
        skillIds: [],
        schedule: createEmptyWeeklySchedule(),
      });
    }
  }, [faculty, open]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{faculty ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
          <DialogDescription>
            {faculty ? "Update the details of the faculty member." : "Enter the details for the new faculty member."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid md:grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="md:text-right">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="md:col-span-3"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="md:text-right">
              Email
            </Label>
            <Input
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="md:col-span-3"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="md:text-right">
              Phone
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="md:col-span-3"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-4">
            <Label htmlFor="skills" className="md:text-right">
              Skills
            </Label>
            <div className="md:col-span-3">
              <Select
                onValueChange={(value) => {
                  if (!formData.skillIds.includes(value)) {
                    setFormData({ ...formData, skillIds: [...formData.skillIds, value] });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skills" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skillIds.map(skillId => {
                  const skill = skills.find(s => s.id === skillId);
                  return (
                    <Badge key={skillId} variant="secondary">
                      {skill?.name}
                      <button
                        type="button"
                        className="ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setFormData({ ...formData, skillIds: formData.skillIds.filter(id => id !== skillId) })}
                      >
                        &times;
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
          <Separator className="col-span-4" />
          <ScheduleEditor
            schedule={formData.schedule}
            onChange={(schedule) => setFormData({ ...formData, schedule })}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FacultyManagement() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchFaculties = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faculty`);
      const data = await response.json();
      setFaculties(data);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/skills`);
      const data = await response.json();
      setSkills(data);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchSkills();
  }, []);

  const filteredFaculties = faculties.filter(faculty =>
    faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.skills.some(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddFaculty = () => {
    setSelectedFaculty(undefined);
    setIsDialogOpen(true);
  };

  const handleEditFaculty = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setIsDialogOpen(true);
  };

  const handleSaveFaculty = async (data: FacultyFormData) => {
    const facultyPayload = {
      name: data.name,
      email: data.email,
      phone_number: data.phone,
      skillIds: data.skillIds,
    };

    const availabilityPayload = Object.entries(data.schedule)
      .filter(([, daySchedule]) => daySchedule.isAvailable)
      .flatMap(([day, daySchedule]) =>
        daySchedule.timeSlots.map(slot => ({
          day_of_week: day,
          start_time: slot.startTime,
          end_time: slot.endTime,
        }))
      );

    try {
      let facultyResponse;
      let updatedOrNewFaculty;

      if (selectedFaculty) {
        // Update existing faculty
        facultyResponse = await fetch(`${API_BASE_URL}/api/faculty/${selectedFaculty.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(facultyPayload),
        });
        if (facultyResponse.ok) {
            updatedOrNewFaculty = { ...await facultyResponse.json(), id: selectedFaculty.id };
        }
      } else {
        // Add new faculty
        facultyResponse = await fetch(`${API_BASE_URL}/api/faculty`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(facultyPayload),
        });
        if (facultyResponse.ok) {
            updatedOrNewFaculty = await facultyResponse.json();
        }
      }

      if (facultyResponse && facultyResponse.ok && updatedOrNewFaculty) {
        // Now, save the availability for the new or updated faculty
        await fetch(`${API_BASE_URL}/api/availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            facultyId: updatedOrNewFaculty.id,
            availability: availabilityPayload,
          }),
        });
        
        fetchFaculties(); // Refresh the list
        setIsDialogOpen(false);
      } else {
        const errorData = await facultyResponse?.json();
        console.error("Failed to save faculty", errorData);
      }
    } catch (error) {
      console.error("Error saving faculty:", error);
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (confirm("Are you sure you want to delete this faculty member?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/faculty/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchFaculties();
        } else {
          console.error("Failed to delete faculty");
        }
      } catch (error) {
        console.error("Error deleting faculty:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Management</h1>
          <p className="text-muted-foreground">
            Manage faculty members, their schedules, and teaching skills.
          </p>
        </div>
        <Button onClick={handleAddFaculty}>
          <Plus className="h-4 w-4 mr-2" />
          Add Faculty
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Members</CardTitle>
          <CardDescription>
            View and manage all faculty members in your institute.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredFaculties.length} of {faculties.length} faculty members
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculties.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{faculty.name}</div>
                          <div className="text-sm text-muted-foreground">{faculty.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {faculty.skills.map((skill) => (
                          <Badge key={skill.id} variant="outline" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {faculty.availability && faculty.availability.length > 0 ? (
                          faculty.availability.map((slot, index) => (
                            <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground">
                              <span className="font-medium capitalize">{slot.day_of_week}:</span>
                              <span>{slot.start_time} - {slot.end_time}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No availability set</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditFaculty(faculty)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFaculty(faculty.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFaculties.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No faculty members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <FacultyDialog
        faculty={selectedFaculty}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveFaculty}
        skills={skills}
      />
    </div>
  );
}