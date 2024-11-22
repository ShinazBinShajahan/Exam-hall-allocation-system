import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Subject = {
  code: string;
  name: string;
  batchName: string;
  students: number;
  studentIds: string[];
};

type SubjectFormProps = {
  addSubject: (subject: Subject) => void;
  editingSubject: Subject | null;
  onEditComplete: () => void;
};

export default function SubjectForm({
  addSubject,
  editingSubject,
  onEditComplete,
}: SubjectFormProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [students, setStudents] = useState("");
  const [studentIds, setStudentIds] = useState("");

  useEffect(() => {
    if (editingSubject) {
      setCode(editingSubject.code);
      setName(editingSubject.name);
      setBatchName(editingSubject.batchName);
      setStudents(editingSubject.students.toString());
      setStudentIds(editingSubject.studentIds.join(", "));
    }
  }, [editingSubject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code && name && batchName && students && studentIds) {
      const studentIdArray = studentIds
        .split(/[\s,]+/)
        .filter((id) => id.trim() !== "");
      if (parseInt(students, 10) !== studentIdArray.length) {
        alert(
          `Mismatch: ${studentIdArray.length} student IDs entered, but ${students} students specified.`
        );
        return;
      }
      addSubject({
        code,
        name,
        batchName,
        students: parseInt(students, 10),
        studentIds: studentIdArray,
      });
      setCode("");
      setName("");
      setBatchName("");
      setStudents("");
      setStudentIds("");
      if (editingSubject) onEditComplete();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">Subject Code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter subject code"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="name">Subject Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter subject name"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="batchName">Batch Name</Label>
        <Input
          id="batchName"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          placeholder="Enter batch name"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="students">Number of Students</Label>
        <Input
          id="students"
          type="number"
          value={students}
          onChange={(e) => setStudents(e.target.value)}
          placeholder="Enter number of students"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="studentIds">Student IDs (paste from Excel)</Label>
        <textarea
          id="studentIds"
          value={studentIds}
          onChange={(e) => {
            setStudentIds(e.target.value);
            const ids = e.target.value
              .split(/[\s,]+/)
              .filter((id) => id.trim() !== "");
            setStudents(ids.length.toString());
          }}
          placeholder="Paste student IDs here, one per line or comma-separated"
          className="w-full h-32 mt-1 px-3 py-2 bg-background text-foreground border border-input rounded-md"
          required
        />
      </div>
      {studentIds.trim() !== "" && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Parsed Student IDs</h3>
          <div className="border border-input rounded-md max-h-64 overflow-y-scroll">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-muted text-black font-bold text-left">
                    Student ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentIds
                  .split(/[\s,]+/)
                  .filter((id) => id.trim() !== "")
                  .map((id, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-background" : "bg-muted"}
                    >
                      <td className="px-4 py-2">{id}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105"
      >
        {editingSubject ? "Update Subject" : "Add Subject"}
      </Button>
    </form>
  );
}
