"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SubjectForm from "@/components/SubjectForm";
import VenueForm from "@/components/VenueForm";
import AllocationDisplay from "@/components/AllocationDisplay";
import Layout from "@/components/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Edit, Trash2, Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from "jspdf";
import "jspdf-autotable";

type Subject = {
  code: string;
  name: string;
  batchName: string;
  students: number;
  studentIds: string[];
};

type Venue = {
  roomNumber: string;
  classroomName: string;
  rows: number;
  columns: number;
};

type Allocation = {
  roomNumber: string;
  classroomName: string;
  seats: Array<{
    subjectCode: string;
    subjectName: string;
    batchName: string;
    studentId: string;
  }>[];
  totalStudents: number;
  allocatedSubjects: Set<string>;
  allocatedBatches: Set<string>;
};

export default function ExamHallAllocation() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [step, setStep] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [unallocatedStudents, setUnallocatedStudents] = useState<
    {
      subjectCode: string;
      subjectName: string;
      batchName: string;
      studentId: string;
    }[]
  >([]);

  useEffect(() => {
    const newTotalStudents = subjects.reduce(
      (sum, subject) => sum + subject.students,
      0
    );
    setTotalStudents(newTotalStudents);
  }, [subjects]);

  useEffect(() => {
    const newTotalCapacity = venues.reduce(
      (sum, venue) => sum + venue.rows * venue.columns,
      0
    );
    setTotalCapacity(newTotalCapacity);
  }, [venues]);

  const addSubject = (subject: Subject) => {
    if (editingSubject) {
      setSubjects(
        subjects.map((s) => (s.code === editingSubject.code ? subject : s))
      );
      setEditingSubject(null);
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const editSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setStep(1);
  };

  const deleteSubject = (subjectCode: string) => {
    setSubjects(subjects.filter((s) => s.code !== subjectCode));
  };

  const addVenue = (venue: Venue) => {
    if (editingVenue) {
      setVenues(
        venues.map((v) =>
          v.roomNumber === editingVenue.roomNumber ? venue : v
        )
      );
      setEditingVenue(null);
    } else {
      setVenues([...venues, venue]);
    }
  };

  const editVenue = (venue: Venue) => {
    setEditingVenue(venue);
    setStep(2);
  };

  const deleteVenue = (roomNumber: string) => {
    setVenues(venues.filter((v) => v.roomNumber !== roomNumber));
  };

  const proceedToAllocation = () => {
    if (totalCapacity >= totalStudents) {
      setStep(3);
      setError(null);
    } else {
      setError(
        "Total venue capacity is less than the number of students. Please add more venues."
      );
    }
  };

  const allocateSeats = () => {
    let remainingStudents = subjects.flatMap((subject) =>
      subject.studentIds.map((id) => ({
        subjectCode: subject.code,
        subjectName: subject.name,
        batchName: subject.batchName,
        studentId: id,
      }))
    );
    const newAllocations: Allocation[] = [];

    const sortedVenues = [...venues].sort(
      (a, b) => b.rows * b.columns - a.rows * a.columns
    );

    sortedVenues.forEach((venue) => {
      const allocation: Allocation = {
        roomNumber: venue.roomNumber,
        classroomName: venue.classroomName,
        seats: Array(venue.rows)
          .fill(null)
          .map(() =>
            Array(venue.columns).fill({
              subjectCode: "",
              subjectName: "",
              batchName: "",
              studentId: "",
            })
          ),
        totalStudents: 0,
        allocatedSubjects: new Set(),
        allocatedBatches: new Set(),
      };

      const isDHRoom = venue.roomNumber.startsWith("DH");

      if (isDHRoom) {
        const subjectsInRoom = new Set(
          remainingStudents.map((student) => student.subjectCode)
        );
        const subjectArray = Array.from(subjectsInRoom);
        let subjectIndex = 0;

        for (let col = 0; col < venue.columns; col++) {
          for (let row = 0; row < venue.rows; row++) {
            if (remainingStudents.length === 0) break;

            const currentSubject = subjectArray[subjectIndex];
            const availableStudents = remainingStudents.filter(
              (student) => student.subjectCode === currentSubject
            );

            if (availableStudents.length > 0) {
              const student = availableStudents[0];
              allocation.seats[row][col] = student;
              allocation.totalStudents++;
              allocation.allocatedSubjects.add(student.subjectName);
              allocation.allocatedBatches.add(student.batchName);
              remainingStudents = remainingStudents.filter(
                (s) => s !== student
              );
            }
          }

          if (remainingStudents.length === 0) break;
          subjectIndex = (subjectIndex + 1) % subjectArray.length;
        }
      } else {
        for (let col = 0; col < venue.columns; col++) {
          for (let row = 0; row < venue.rows; row++) {
            if (remainingStudents.length === 0) break;

            const availableStudents = remainingStudents.filter((student) => {
              if (isDHRoom) return true;
              const leftOk =
                col === 0 ||
                allocation.seats[row][col - 1].subjectCode !==
                  student.subjectCode;
              const rightOk =
                col === venue.columns - 1 ||
                allocation.seats[row][col + 1].subjectCode !==
                  student.subjectCode;
              return leftOk && rightOk;
            });

            if (availableStudents.length > 0) {
              const student = availableStudents[0];
              allocation.seats[row][col] = student;
              allocation.totalStudents++;
              allocation.allocatedSubjects.add(student.subjectName);
              allocation.allocatedBatches.add(student.batchName);
              remainingStudents = remainingStudents.filter(
                (s) => s !== student
              );
            }
          }
          if (remainingStudents.length === 0) break;
        }
      }

      if (
        allocation.seats.some((row) =>
          row.some((seat) => seat.subjectCode !== "")
        )
      ) {
        newAllocations.push(allocation);
      }
    });

    if (remainingStudents.length > 0) {
      newAllocations.forEach((allocation) => {
        for (let col = 0; col < allocation.seats[0].length; col++) {
          for (let row = 0; row < allocation.seats.length; row++) {
            if (remainingStudents.length === 0) break;
            if (allocation.seats[row][col].subjectCode === "") {
              const student = remainingStudents[0];
              const isDHRoom = allocation.roomNumber.startsWith("DH");
              const leftOk =
                col === 0 ||
                allocation.seats[row][col - 1].subjectCode !==
                  student.subjectCode;
              const rightOk =
                col === allocation.seats[0].length - 1 ||
                allocation.seats[row][col + 1].subjectCode !==
                  student.subjectCode;
              if (isDHRoom || (leftOk && rightOk)) {
                allocation.seats[row][col] = student;
                allocation.totalStudents++;
                allocation.allocatedSubjects.add(student.subjectName);
                allocation.allocatedBatches.add(student.batchName);
                remainingStudents.shift();
              }
            }
          }
          if (remainingStudents.length === 0) break;
        }
      });
    }

    setAllocations(newAllocations);
    setUnallocatedStudents(remainingStudents);
    setStep(4);

    if (remainingStudents.length > 0) {
      setError(
        `Warning: ${remainingStudents.length} student(s) could not be allocated. Please choose an option below.`
      );
    } else {
      setError(null);
    }
  };

  const addExtraClassroom = () => {
    setStep(2);
    setError(
      "Please add an extra classroom to accommodate the remaining students."
    );
  };

  const fillWithoutAdjacency = () => {
    const newAllocations = [...allocations];
    const remainingStudents = [...unallocatedStudents];

    newAllocations.forEach((allocation) => {
      for (let col = 0; col < allocation.seats[0].length; col++) {
        for (let row = 0; row < allocation.seats.length; row++) {
          if (remainingStudents.length === 0) break;
          if (allocation.seats[row][col].subjectCode === "") {
            const student = remainingStudents.shift()!;
            allocation.seats[row][col] = student;
            allocation.totalStudents++;
            allocation.allocatedSubjects.add(student.subjectName);
            allocation.allocatedBatches.add(student.batchName);
          }
        }
        if (remainingStudents.length === 0) break;
      }
    });

    setAllocations(newAllocations);
    setUnallocatedStudents(remainingStudents);
    setError(
      remainingStudents.length > 0
        ? `${remainingStudents.length} student(s) still could not be allocated. Please add more classrooms.`
        : null
    );
  };

  const isNextDisabled = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return subjects.length === 0;
      case 2:
        return venues.length === 0;
      default:
        return false;
    }
  };

  const downloadAllPDF = () => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    allocations.forEach((allocation, index) => {
      if (index > 0) pdf.addPage();
      generatePDFForVenue(pdf, allocation);
    });
    pdf.save("all_venues_allocation.pdf");
  };

  const downloadVenuePDF = (allocation: Allocation) => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    generatePDFForVenue(pdf, allocation);
    pdf.save(`venue_${allocation.roomNumber}_allocation.pdf`);
  };

  const generatePDFForVenue = (pdf: jsPDF, allocation: Allocation) => {
    pdf.setFontSize(18);
    pdf.text(
      `Room ${allocation.roomNumber}${
        allocation.classroomName ? ` - ${allocation.classroomName}` : ""
      }`,
      14,
      15
    );
    pdf.setFontSize(12);
    pdf.text(`Total Students: ${allocation.totalStudents}`, 14, 25);
    pdf.text(
      `Allocated Subjects: ${Array.from(allocation.allocatedSubjects).join(
        ", "
      )}`,
      14,
      35
    );
    pdf.text(
      `Allocated Batches: ${Array.from(allocation.allocatedBatches).join(
        ", "
      )}`,
      14,
      45
    );

    const tableData = allocation.seats.map((row, rowIndex) => [
      rowIndex + 1,
      ...row.map((seat) => (seat.studentId ? `${seat.studentId}` : "-")),
    ]);

    const columnStyles = allocation.seats[0].reduce(
      (styles, _, index) => {
        styles[index + 1] = { cellWidth: "auto" };
        return styles;
      },
      { 0: { cellWidth: 20 } }
    );

    pdf.autoTable({
      head: [
        [
          "",
          ...Array(allocation.seats[0].length)
            .fill(0)
            .map((_, i) => i + 1),
        ],
      ],
      body: tableData,
      startY: 55,
      columnStyles: columnStyles,
      styles: { cellPadding: 2, fontSize: 10 },
      headStyles: { fillColor: [200, 220, 255], fontSize: 12 },
    });
  };

  const printAllocation = (allocation: Allocation) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Exam Hall Allocation</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid black; padding: 8px; text-align: center; width: 40px; height: 40px; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Room ${allocation.roomNumber}${
        allocation.classroomName ? ` - ${allocation.classroomName}` : ""
      }</h1>
            <p>Total Students: ${allocation.totalStudents}</p>
            <p>Allocated Subjects: ${Array.from(
              allocation.allocatedSubjects
            ).join(", ")}</p>
            <p>Allocated Batches: ${Array.from(
              allocation.allocatedBatches
            ).join(", ")}</p>
            <table>
              <tr>
                <th></th>
                ${Array.from(
                  { length: allocation.seats[0].length },
                  (_, i) => `<th>${i + 1}</th>`
                ).join("")}
              </tr>
              ${allocation.seats
                .map(
                  (row, rowIndex) => `
                <tr>
                  <th>${rowIndex + 1}</th>
                  ${row
                    .map((seat) => `<td>${seat.studentId || "-"}</td>`)
                    .join("")}
                </tr>
              `
                )
                .join("")}
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Note: In rooms starting with 'DH', adjacent columns can have the
              same subjects. For other rooms, adjacent columns cannot have the
              same subjects. Rooms are filled efficiently to minimize space
              wastage.
            </p>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Tabs value={`step-${step}`} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                {["Subjects", "Venues", "Review", "Results"].map(
                  (tabName, index) => (
                    <TabsTrigger
                      key={index}
                      value={`step-${index + 1}`}
                      onClick={() => setStep(index + 1)}
                      className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                    >
                      {tabName}
                    </TabsTrigger>
                  )
                )}
              </TabsList>
              <TabsContent value="step-1">
                <SubjectForm
                  addSubject={addSubject}
                  editingSubject={editingSubject}
                  onEditComplete={() => setEditingSubject(null)}
                />
                <div className="mt-4">
                  <h2 className="text-xl font-semibold mb-2 text-blue-700">
                    Entered Subjects:
                  </h2>
                  <ul className="space-y-2">
                    {subjects.map((subject, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                      >
                        <span>
                          {subject.code} - {subject.name} ({subject.batchName})
                          - {subject.students} students
                        </span>
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editSubject(subject)}
                            className="text-blue-700 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSubject(subject.code)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 font-semibold text-blue-700">
                  Total students: {totalStudents}
                </p>
                <Button
                  className="mt-4 bg-blue-700 text-white hover:bg-blue-800"
                  onClick={() => setStep(2)}
                  disabled={isNextDisabled(1)}
                >
                  Next: Add Venues
                </Button>
              </TabsContent>
              <TabsContent value="step-2">
                <VenueForm
                  addVenue={addVenue}
                  editingVenue={editingVenue}
                  onEditComplete={() => setEditingVenue(null)}
                />
                <div className="mt-4">
                  <h2 className="text-xl font-semibold mb-2 text-blue-700">
                    Entered Venues:
                  </h2>
                  <ul className="space-y-2">
                    {venues.map((venue, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                      >
                        <span>
                          Room {venue.roomNumber}
                          {venue.classroomName && ` - ${venue.classroomName}`}
                          {` - ${venue.rows} rows, ${venue.columns} columns`}
                        </span>
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editVenue(venue)}
                            className="text-blue-700 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteVenue(venue.roomNumber)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 font-semibold text-blue-700">
                  Total capacity: {totalCapacity}
                </p>
                <p className="mt-2 font-semibold text-blue-700">
                  Total students: {totalStudents}
                </p>
                <Button
                  className="mt-4 bg-blue-700 text-white hover:bg-blue-800"
                  onClick={proceedToAllocation}
                  disabled={isNextDisabled(2)}
                >
                  Next: Review
                </Button>
              </TabsContent>
              <TabsContent value="step-3">
                <h2 className="text-xl font-semibold mb-2 text-blue-700">
                  Review and Allocate
                </h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-700">
                    Subjects:
                  </h3>
                  {subjects.map((subject, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-blue-700">
                          {subject.code} - {subject.name} ({subject.batchName})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Number of students: {subject.students}
                        </p>
                        <p className="text-sm text-gray-600">Student IDs:</p>
                        <p className="text-sm">
                          {subject.studentIds.join(", ")}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  <h3 className="text-lg font-semibold mt-6 text-blue-700">
                    Venues:
                  </h3>
                  {venues.map((venue, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-blue-700">
                          Room {venue.roomNumber}{" "}
                          {venue.classroomName && `- ${venue.classroomName}`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Rows: {venue.rows}
                        </p>
                        <p className="text-sm text-gray-600">
                          Columns: {venue.columns}
                        </p>
                        <p className="text-sm text-gray-600">
                          Capacity: {venue.rows * venue.columns}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button
                  className="mt-4 bg-blue-700 text-white hover:bg-blue-800"
                  onClick={allocateSeats}
                >
                  Allocate Seats
                </Button>
              </TabsContent>
              <TabsContent value="step-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-blue-700">
                    Seat Allocation Results
                  </h2>
                  <div className="space-x-2">
                    <Button
                      onClick={downloadAllPDF}
                      variant="outline"
                      className="border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download All PDFs
                    </Button>
                    <Button
                      onClick={() => window.print()}
                      variant="outline"
                      className="border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
                    >
                      <Printer className="mr-2 h-4 w-4" /> Print All
                    </Button>
                  </div>
                </div>
                <AllocationDisplay
                  allocations={allocations}
                  downloadVenuePDF={downloadVenuePDF}
                  printAllocation={printAllocation}
                />
                {unallocatedStudents.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <p className="font-semibold text-blue-700">
                      Options for remaining students:
                    </p>
                    <Button
                      onClick={addExtraClassroom}
                      className="mr-4 bg-blue-700 text-white hover:bg-blue-800"
                    >
                      Add Extra Classroom
                    </Button>
                    <Button
                      onClick={fillWithoutAdjacency}
                      variant="secondary"
                      className="bg-gray-200 text-blue-700 hover:bg-gray-300"
                    >
                      Fill Without Checking Adjacency
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
