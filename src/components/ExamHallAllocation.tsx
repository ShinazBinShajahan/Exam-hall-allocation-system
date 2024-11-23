"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SubjectForm from "@/components/SubjectForm";
import VenueForm from "@/components/VenueForm";
import AllocationDisplay from "@/components/AllocationDisplay";
import Layout from "@/components/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Printer,
  BookOpen,
  Building,
  ClipboardList,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Allocation } from "@/components/AllocationDisplay";

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

// type Allocations = {
//   roomNumber: string;
//   classroomName: string;
//   seats: Array<{
//     subjectCode: string;
//     subjectName: string;
//     batchName: string;
//     studentId: string;
//   }>[];
//   totalStudents: number;
//   allocatedSubjects: Set<string>;
//   allocatedBatches: Set<string>;
// };

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

  const allocateSeats = () => {
    if (totalCapacity < totalStudents) {
      setError(
        "Total venue capacity is less than the number of students. Please add more venues."
      );
      return;
    }

    const newAllocations: Allocation[] = [];
    const remainingStudents = subjects.flatMap((subject) =>
      subject.studentIds.map((studentId) => ({
        subjectCode: subject.code,
        subjectName: subject.name,
        batchName: subject.batchName,
        studentId,
      }))
    );

    venues.forEach((venue) => {
      const allocation: Allocation = {
        roomNumber: venue.roomNumber,
        classroomName: venue.classroomName,
        seats: Array(venue.rows)
          .fill(null)
          .map(() => Array(venue.columns).fill(null)),
        totalStudents: 0,
        allocatedSubjects: new Set(),
        allocatedBatches: new Set(),
      };

      const isDHRoom = venue.roomNumber.startsWith("DH");

      for (let row = 0; row < venue.rows; row++) {
        for (let col = 0; col < venue.columns; col++) {
          if (remainingStudents.length === 0) break;

          let studentIndex = -1;
          if (isDHRoom) {
            studentIndex = 0;
          } else {
            for (let i = 0; i < remainingStudents.length; i++) {
              const student = remainingStudents[i];
              if (
                (col === 0 ||
                  allocation.seats[row][col - 1]?.subjectCode !==
                    student.subjectCode) &&
                (row === 0 ||
                  allocation.seats[row - 1][col]?.subjectCode !==
                    student.subjectCode)
              ) {
                studentIndex = i;
                break;
              }
            }
          }

          if (studentIndex !== -1) {
            const student = remainingStudents[studentIndex];
            allocation.seats[row][col] = student;
            allocation.totalStudents++;
            allocation.allocatedSubjects.add(student.subjectCode);
            allocation.allocatedBatches.add(student.batchName);
            remainingStudents.splice(studentIndex, 1);
          }
        }
      }

      newAllocations.push(allocation);
    });

    setAllocations(newAllocations);
    setUnallocatedStudents(remainingStudents);
    setStep(4);
    setError(null);
  };

  const downloadAllPDF = () => {
    const pdf = new jsPDF();
    allocations.forEach((allocation, index) => {
      if (index > 0) {
        pdf.addPage();
      }
      generatePDFForVenue(pdf, allocation);
    });
    pdf.save("all_allocations.pdf");
  };

  const downloadVenuePDF = (allocation: Allocation) => {
    const pdf = new jsPDF();
    generatePDFForVenue(pdf, allocation);
    pdf.save(`allocation_${allocation.roomNumber}.pdf`);
  };

  const generatePDFForVenue = (pdf: jsPDF, allocation: Allocation) => {
    pdf.setFontSize(16);
    pdf.text(`${allocation.roomNumber} - ${allocation.classroomName}`, 14, 20);

    pdf.setFontSize(12);
    pdf.text(`Total Students: ${allocation.totalStudents}`, 14, 30);
    pdf.text(
      `Subjects: ${Array.from(allocation.allocatedSubjects).join(", ")}`,
      14,
      40
    );
    pdf.text(
      `Batches: ${Array.from(allocation.allocatedBatches).join(", ")}`,
      14,
      50
    );

    const tableData = allocation.seats.map((row) =>
      row.map((seat) =>
        seat ? `${seat.studentId}\n${seat.subjectCode}\n${seat.batchName}` : ""
      )
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdf as any).autoTable({
      startY: 60,
      head: [
        Array(allocation.seats[0].length)
          .fill("")
          .map((_, i) => `${i + 1}`),
      ],
      body: tableData,
      theme: "grid",
      styles: { cellPadding: 2, fontSize: 8, cellWidth: "wrap" },
      columnStyles: { 0: { cellWidth: "auto" } },
      didDrawCell: (data: {
        section: string;
        column: { index: number };
        row: { index: number };
        cell: { x: number; y: number };
      }) => {
        if (data.section === "body" && data.column.index === 0) {
          pdf.setFontSize(8);
          pdf.text(`${data.row.index + 1}`, data.cell.x + 2, data.cell.y + 4);
        }
      },
    });
  };

  const printAllocation = (allocation: Allocation) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Allocation for ${allocation.roomNumber}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 20px; /* Added margin for cleaner appearance on print */
            padding: 0;
            line-height: 1.3;
            color: #000;
            font-size: 10pt;
            background: #fff;
        }

        header {
            text-align: center;
            padding: 10px 0;
            border-bottom: 2px solid #000;
            margin-bottom: 10px;
        }

        main {
            padding: 10px;
            margin: 0 auto;
            width: calc(100% - 40px); /* Adjusted to account for body margins */
        }

        h1 {
            font-size: 1.6em;
            margin: 0;
            text-transform: uppercase;
        }

        .details {
            font-size: 1rem;
            margin: 10px 0;
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            table-layout: auto;
            font-size: 10pt;
        }

        th, td {
            border: 1px solid #000;
            padding: 12px;
            text-align: center;
            font-weight: bold;
            word-wrap: break-word;
            background: #fff;
        }

        th {
            border-bottom: 2px solid #000;
        }

        td {
            line-height: 1.4;
        }

        td:empty {
            height: 50px; /* Increased empty height for better spacing */
        }

        th:first-child, td:first-child {
            width: 40px;
        }

        .footer {
            text-align: center;
            padding-top: 10px;
            border-top: 1px solid #000;
            font-size: 0.8em;
            margin-top: 20px;
        }

        a {
            color: #000;
            text-decoration: none;
        }


        /* Print-specific styles */
        @media print {
            body {
                margin: 20px;
                font-size: 10pt;
            }

            header, .footer {
                page-break-after: avoid;
            }

            table {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>Room Number : ${allocation.roomNumber} ${
        allocation.classroomName ? ` - ${allocation.classroomName}` : ""
      }</h1>
    </header>
    <main>
        <p class="details">Total Students: ${
          allocation.totalStudents
        } | Subjects: ${Array.from(allocation.allocatedSubjects).join(
        ", "
      )} | <br> Batches: ${Array.from(allocation.allocatedBatches).join(", ")}</p>
        <table>
            <thead>
                <tr>
                    <th></th>
                    ${allocation.seats[0]
                      .map((_, colIndex) => `<th>${colIndex + 1}</th>`)
                      .join("")}
                </tr>
            </thead>
            <tbody>
                ${allocation.seats
                  .map(
                    (row, rowIndex) => `
                        <tr>
                            <th>${rowIndex + 1}</th>
                            ${row
                              .map(
                                (seat) => `
                                    <td>
                                        ${seat ? `${seat.studentId}` : ""}
                                    </td>
                                `
                              )
                              .join("")}
                        </tr>
                    `
                  )
                  .join("")}
            </tbody>
        </table>
    </main>
    <div class="footer">
        *Timetable generated using <a href="http://www.generator.com" target="_blank">www.generator.com</a>, visit the link to view seat allocations online.
    </div>
</body>
</html>

      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const addExtraClassroom = () => {
    setStep(2);
    setError(
      "Please add an extra classroom to accommodate remaining students."
    );
  };

  const fillWithoutAdjacency = () => {
    const newAllocations = [...allocations];
    const remainingStudents = [...unallocatedStudents];

    newAllocations.forEach((allocation) => {
      for (let row = 0; row < allocation.seats.length; row++) {
        for (let col = 0; col < allocation.seats[row].length; col++) {
          if (!allocation.seats[row][col] && remainingStudents.length > 0) {
            const student = remainingStudents.shift()!;
            allocation.seats[row][col] = student;
            allocation.totalStudents++;
            allocation.allocatedSubjects.add(student.subjectCode);
            allocation.allocatedBatches.add(student.batchName);
          }
        }
      }
    });

    setAllocations(newAllocations);
    setUnallocatedStudents(remainingStudents);
  };

  const tabData = [
    { id: 1, name: "Subjects", icon: BookOpen },
    { id: 2, name: "Venues", icon: Building },
    { id: 3, name: "Review", icon: ClipboardList },
    { id: 4, name: "Results", icon: CheckCircle },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <Card className="w-full mx-auto bg-white shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-gray-600 mb-4">
              Note: In rooms starting with DH, adjacent columns can have the
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
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 bg-blue-50 p-1 rounded-lg">
                {tabData.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={`step-${tab.id}`}
                    onClick={() => setStep(tab.id)}
                    className="data-[state=active]:bg-blue-700 data-[state=active]:text-white transition-all duration-200 ease-in-out"
                  >
                    <div className="flex items-center space-x-2">
                      <tab.icon className="h-5 w-5" />
                      <span className="hidden sm:inline">{tab.name}</span>
                    </div>
                  </TabsTrigger>
                ))}
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
                  {subjects.length > 0 ? (
                    <ul className="space-y-2">
                      {subjects.map((subject, index) => (
                        <li
                          key={index}
                          className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-100 p-2 rounded-md"
                        >
                          <span className="mb-2 sm:mb-0">
                            {subject.code} - {subject.name} ({subject.batchName}
                            ) - {subject.students} students
                          </span>
                          <div className="flex space-x-2">
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
                  ) : (
                    <p className="text-gray-500">No subjects added yet.</p>
                  )}
                </div>
                <p className="mt-4 font-semibold text-blue-700">
                  Total students: {totalStudents}
                </p>
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
                  {venues.length > 0 ? (
                    <ul className="space-y-2">
                      {venues.map((venue, index) => (
                        <li
                          key={index}
                          className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-100 p-2 rounded-md"
                        >
                          <span className="mb-2 sm:mb-0">
                            {venue.roomNumber}
                            {venue.classroomName && ` - ${venue.classroomName}`}
                            {` - ${venue.rows} rows, ${venue.columns} columns`}
                          </span>
                          <div className="flex space-x-2">
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
                  ) : (
                    <p className="text-gray-500">No venues added yet.</p>
                  )}
                </div>
                <p className="mt-4 font-semibold text-blue-700">
                  Total capacity: {totalCapacity}
                </p>
                <p className="mt-2 font-semibold text-blue-700">
                  Total students: {totalStudents}
                </p>
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
                        <p className="text-sm break-words">
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
                          {venue.roomNumber}{" "}
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
                  className="mt-4 bg-blue-700 text-white hover:bg-blue-800 w-full sm:w-auto"
                  onClick={allocateSeats}
                >
                  Allocate Seats
                </Button>
              </TabsContent>
              <TabsContent value="step-4">
                {allocations.length > 0 ? (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                      <h2 className="text-xl font-semibold text-blue-700 mb-2 sm:mb-0">
                        Seat Allocation Results
                      </h2>
                      <div className="space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          onClick={downloadAllPDF}
                          variant="outline"
                          className="w-full sm:w-auto border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
                        >
                          <Download className="mr-2 h-4 w-4" /> Download All
                          PDFs
                        </Button>
                        <Button
                          onClick={() => window.print()}
                          variant="outline"
                          className="w-full sm:w-auto border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
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
                          className="w-full sm:w-auto mr-0 sm:mr-4 mb-2 sm:mb-0 bg-blue-700 text-white hover:bg-blue-800"
                        >
                          Add Extra Classroom
                        </Button>
                        <Button
                          onClick={fillWithoutAdjacency}
                          variant="secondary"
                          className="w-full sm:w-auto bg-gray-200 text-blue-700 hover:bg-gray-300"
                        >
                          Fill Without Checking Adjacency
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Allocations Made
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Please go to the Review tab and allocate seats before
                      viewing results.
                    </p>
                    <Button
                      onClick={() => setStep(3)}
                      className="bg-blue-700 text-white hover:bg-blue-800"
                    >
                      Go to Review
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
