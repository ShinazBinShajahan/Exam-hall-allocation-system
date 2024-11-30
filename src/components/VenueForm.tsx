import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Venue = {
  roomNumber: string;
  classroomName: string;
  rows: number;
  columns: number;
};

type VenueFormProps = {
  addVenue: (venue: Venue) => void;
  editingVenue: Venue | null;
  onEditComplete: () => void;
};

export default function VenueForm({
  addVenue,
  editingVenue,
  onEditComplete,
}: VenueFormProps) {
  const [roomNumber, setRoomNumber] = useState("");
  const [classroomName, setClassroomName] = useState("");
  const [rows, setRows] = useState("");
  const [columns, setColumns] = useState("");

  useEffect(() => {
    if (editingVenue) {
      setRoomNumber(editingVenue.roomNumber);
      setClassroomName(editingVenue.classroomName);
      setRows(editingVenue.rows.toString());
      setColumns(editingVenue.columns.toString());
    } else {
      setRoomNumber("");
      setClassroomName("");
      setRows("");
      setColumns("");
    }
  }, [editingVenue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVenue: Venue = {
      roomNumber,
      classroomName,
      rows: parseInt(rows),
      columns: parseInt(columns),
    };
    addVenue(newVenue);
    setRoomNumber("");
    setClassroomName("");
    setRows("");
    setColumns("");
    if (editingVenue) {
      onEditComplete();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="roomNumber">Room Number</Label>
        <Input
          id="roomNumber"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="classroomName">Classroom Name</Label>
        <Input
          id="classroomName"
          value={classroomName}
          onChange={(e) => setClassroomName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="rows">Number of Rows</Label>
        <Input
          id="rows"
          type="number"
          value={rows}
          onChange={(e) => setRows(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="columns">Number of Columns</Label>
        <Input
          id="columns"
          type="number"
          value={columns}
          onChange={(e) => setColumns(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        {editingVenue ? "Update Venue" : "Add Venue"}
      </Button>
    </form>
  );
}
