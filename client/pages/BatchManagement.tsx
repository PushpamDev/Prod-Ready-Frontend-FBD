import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Calendar, Users, MoreVertical } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { API_BASE_URL } from "@/lib/api";

// Type definitions
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Availability {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface Faculty {
  id: string;
  name: string;
  type: "full-time" | "part-time";
  skills: Skill[];
  isActive: boolean;
  availability: Availability[];
}

export interface Student {
  id: string;
  name: string;
  admission_number: string;
  phone_number: string;
}

export interface Batch {
  id: string;
  name: string;
  faculty_id: string;
  student_ids: string[];
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
  skill: Skill;
}

const BATCH_STATUSES: Batch['status'][] = ["Upcoming", "active", "completed"];

// --- Components ---

interface BatchFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  facultyId: string;
  skillId: string;
  maxStudents: number;
  status: "Upcoming" | "active" | "completed";
  studentIds: string[];
  daysOfWeek: string[];
}

interface BatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch?: Batch;
  faculties: Faculty[];
  allStudents: Student[];
  onSave: (data: BatchFormData) => void;
  onStudentAdded: () => void;
}

function BatchDialog({
  batch,
  open,
  onOpenChange,
  onSave,
  allStudents,
  onStudentAdded,
  faculties,
}: BatchDialogProps) {
  const [formData, setFormData] = useState<BatchFormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    facultyId: "",
    skillId: "",
    maxStudents: 30,
    status: "Upcoming",
    studentIds: [],
    daysOfWeek: [],
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentAdmissionNumber, setNewStudentAdmissionNumber] = useState("");
  const [newStudentPhoneNumber, setNewStudentPhoneNumber] = useState("");

  const handleAddStudent = async () => {
    if (newStudentName.trim() && newStudentAdmissionNumber.trim()) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/students`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newStudentName,
            admission_number: newStudentAdmissionNumber,
            phone_number: newStudentPhoneNumber,
          }),
        });

        if (response.ok) {
          onStudentAdded();
          setNewStudentName("");
          setNewStudentAdmissionNumber("");
          setNewStudentPhoneNumber("");
        } else {
          console.error("Failed to add student");
        }
      } catch (error) {
        console.error("Error adding student:", error);
      }
    }
  };

  useEffect(() => {
    const fetchSkillsData = async () => {
      setIsLoading(true);
      try {
        const skillsRes = await fetch(`${API_BASE_URL}/api/skills`);
        const skillsData = await skillsRes.json();
        setSkills(Array.isArray(skillsData) ? skillsData : []);
      } catch (error) {
        console.error("Error fetching skills:", error);
        setSkills([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchSkillsData();
    }
  }, [open]);

  useEffect(() => {
    if (batch) {
      setFormData({
        name: batch.name,
        description: batch.description || "",
        startDate: batch.start_date ? new Date(batch.start_date).toISOString().split('T')[0] : "",
        endDate: batch.end_date ? new Date(batch.end_date).toISOString().split('T')[0] : "",
        startTime: batch.start_time || "",
        endTime: batch.end_time || "",
        facultyId: batch.faculty?.id || "",
        skillId: batch.skill?.id || "",
        maxStudents: batch.max_students || 30,
        status: batch.status,
        studentIds: batch.students?.map(s => s.id) || [],
        daysOfWeek: batch.days_of_week || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        facultyId: "",
        skillId: "",
        maxStudents: 30,
        status: "Upcoming",
        studentIds: [],
        daysOfWeek: [],
      });
    }
  }, [batch, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const selectedFaculty = faculties.find(f => f.id === formData.facultyId);
  const availableSkills = selectedFaculty ? selectedFaculty.skills : skills;

  const [studentSearch, setStudentSearch] = useState("");

  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{batch ? "Edit Batch" : "Create New Batch"}</DialogTitle>
          <DialogDescription>
            {batch ? "Update batch information." : "Create a new batch."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Batch Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStudents">Max Students</Label>
              <Input 
                id="maxStudents" 
                type="number" 
                min="1" 
                value={formData.maxStudents} 
                onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 30 })} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Enter batch description..." 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={formData.startDate} 
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                type="date" 
                value={formData.endDate} 
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input 
                id="startTime" 
                type="time" 
                value={formData.startTime} 
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input 
                id="endTime" 
                type="time" 
                value={formData.endTime} 
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty</Label>
              <Select 
                value={formData.facultyId} 
                onValueChange={(value) => setFormData({ ...formData, facultyId: value, skillId: "" })}
                disabled={isLoading || faculties.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading faculties..." : "Select faculty"} />
                </SelectTrigger>
                <SelectContent>
                  {faculties.filter(f => f.isActive).map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>{faculty.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill">Skill/Subject</Label>
              <Select 
                value={formData.skillId} 
                onValueChange={(value) => setFormData({ ...formData, skillId: value })} 
                disabled={isLoading || !formData.facultyId || availableSkills.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading skills..." : "Select skill"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BATCH_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={formData.daysOfWeek.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`day-${day}`}>{day}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Students</Label>
            <Input 
              placeholder="Search students by name or admission number..." 
              value={studentSearch} 
              onChange={(e) => setStudentSearch(e.target.value)} 
              className="mb-2"
            />
            <div className="max-h-64 overflow-y-auto rounded-md border p-2">
              {filteredStudents.map((student) => (
                <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.studentIds.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="h-4 w-4"
                  />
                  <span>{student.name} ({student.admission_number})</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
                <Input 
                    placeholder="New Student Name" 
                    value={newStudentName} 
                    onChange={(e) => setNewStudentName(e.target.value)} 
                />
                <Input 
                    placeholder="Admission No." 
                    value={newStudentAdmissionNumber} 
                    onChange={(e) => setNewStudentAdmissionNumber(e.target.value)} 
                />
                <Input 
                    placeholder="Phone No." 
                    value={newStudentPhoneNumber} 
                    onChange={(e) => setNewStudentPhoneNumber(e.target.value)} 
                />
                <Button type="button" onClick={handleAddStudent} disabled={!newStudentName || !newStudentAdmissionNumber}>
                    Add
                </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {batch ? "Update Batch" : "Create Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface StudentListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchName: string;
  students: Student[];
}

function StudentListDialog({ open, onOpenChange, batchName, students }: StudentListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Students in {batchName}</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border mt-4 max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Admission Number</TableHead>
                <TableHead>Phone Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students && students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.admission_number}</TableCell>
                    <TableCell>{student.phone_number}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No students in this batch.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | undefined>(undefined);
  const [studentsOfSelectedBatch, setStudentsOfSelectedBatch] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  const fetchBatches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/batches`);
      const data = await response.json();
      setBatches(data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

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
      setSkills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching skills:", error);
      setSkills([]);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/students`);
      if (res.ok) {
        const data = await res.json();
        setAllStudents(data);
      } else {
        toast.error("Error fetching students", {
          description: "Could not fetch the list of all students.",
        });
      }
    } catch (error: any) {
      toast.error("Error fetching students", {
        description: `An error occurred: ${error.message}`,
      });
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchFaculties();
    fetchSkills();
    fetchAllStudents();
  }, []);

  const handleAddBatch = () => {
    setSelectedBatch(undefined);
    setIsBatchDialogOpen(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsBatchDialogOpen(true);
  };

  const handleViewStudents = async (batch: Batch) => {
    setSelectedBatch(batch);
    try {
      const response = await fetch(`${API_BASE_URL}/api/batches/${batch.id}/students`);
      const data = await response.json();
      setStudentsOfSelectedBatch(data);
      setIsStudentListOpen(true);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSaveBatch = async (data: BatchFormData) => {
    const payload = { ...data };
    try {
      const url = selectedBatch
        ? `${API_BASE_URL}/api/batches/${selectedBatch.id}`
        : `${API_BASE_URL}/api/batches`;
      const method = selectedBatch ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchBatches();
        setIsBatchDialogOpen(false);
        setSelectedBatch(undefined);
      } else {
        console.error("Failed to save batch");
        toast.error("Error saving batch", {
          description: "Could not save the batch.",
        });
      }
    } catch (error: any) {
      console.error("Error saving batch:", error);
      toast.error("Error saving batch", {
        description: `An error occurred: ${error.message}`,
      });
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (confirm("Are you sure you want to delete this batch?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/batches/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchBatches();
        } else {
          console.error("Failed to delete batch");
        }
      } catch (error) {
        console.error("Error deleting batch:", error);
      }
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
          <p className="text-muted-foreground">
            Manage all the batches in your institute.
          </p>
        </div>
        <Button onClick={handleAddBatch}>
          <Plus className="h-4 w-4 mr-2" />
          Add Batch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
          <CardDescription>
            View and manage all batches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredBatches.length} of {batches.length} batches
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.name}</TableCell>
                    <TableCell>{batch.skill?.name || "N/A"}</TableCell>
                    <TableCell>{batch.faculty?.name || "N/A"}</TableCell>
                    <TableCell>{new Date(batch.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(batch.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>{`${batch.start_time} - ${batch.end_time}`}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewStudents(batch)}>
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditBatch(batch)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteBatch(batch.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <BatchDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
        onSave={handleSaveBatch}
        batch={selectedBatch}
        faculties={faculties}
        allStudents={allStudents}
        onStudentAdded={fetchAllStudents}
      />

      {selectedBatch && (
        <StudentListDialog
          open={isStudentListOpen}
          onOpenChange={setIsStudentListOpen}
          batchName={selectedBatch.name}
          students={studentsOfSelectedBatch}
        />
      )}
    </div>
  );
}