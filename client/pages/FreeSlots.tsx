
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { API_BASE_URL } from "@/lib/api";

// Type Definitions
interface Faculty {
  id: string;
  name: string;
  skills: { id: string; name: string }[];
  availability: { day_of_week: string; start_time: string; end_time: string }[];
}

interface Skill {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  faculty: Faculty | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
}

interface FreeSlot {
  faculty: Faculty;
  slots: { date: string; time: string[] }[];
}

export default function FreeSlots() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facultyRes, skillsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/faculty`),
            fetch(`${API_BASE_URL}/api/skills`),
        ]);
        const facultyData = await facultyRes.json();
        const skillsData = await skillsRes.json();
        setFaculties(facultyData);
        setSkills(skillsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    setSearched(true);
    setLoading(true);
    setFreeSlots([]);

    if (!startDate || !endDate) {
      alert("Please select a start and end date.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    if (selectedFaculty) {
      params.append('selectedFaculty', selectedFaculty);
    }
    if (selectedSkill) {
      params.append('selectedSkill', selectedSkill);
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/free-slots?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFreeSlots(data);
    } catch (error) {
      console.error("Failed to fetch free slots:", error);
      alert("Failed to fetch free slots. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Find Free Slots</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select faculty, skills, and a date range to find available slots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Faculty Filter */}
            <div className="space-y-2">
              <label htmlFor="faculty-select">Faculty</label>
              <Select onValueChange={setSelectedFaculty}>
                <SelectTrigger id="faculty-select">
                  <SelectValue placeholder="Select a faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skill Filter */}
            <div className="space-y-2">
              <label htmlFor="skill-select">Skill</label>
              <Select onValueChange={setSelectedSkill}>
                <SelectTrigger id="skill-select">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="start-date">Start Date</label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-date">End Date</label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSearch}>Search Free Slots</Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>Available Slots</CardTitle>
          <CardDescription>
            The calendar below shows the available slots based on your filter
            criteria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <p>Loading...</p>
            </div>
          ) : freeSlots.length > 0 ? (
            <div className="space-y-6">
              {freeSlots.map(({ faculty, slots }) => (
                <div key={faculty.id}>
                  <h3 className="text-xl font-semibold">{faculty.name}</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {slots.map(slot => (
                      <Card key={slot.date}>
                        <CardHeader>
                          <CardTitle>{new Date(slot.date.replace(/-/g, '\/')).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {slot.time.map((time, index) => (
                              <li key={index} className="text-sm text-gray-700">{time}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : searched ? (
            <div className="p-4 text-center text-gray-500">
              <p>No free slots found for the selected criteria.</p>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>
                Select filters and click "Search" to see available slots.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}