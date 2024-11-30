'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import SubjectForm from '@/components/SubjectForm'
import VenueForm from '@/components/VenueForm'
import AllocationDisplay from '@/components/AllocationDisplay'
import Layout from '@/components/Layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Edit, Trash2, Printer, BookOpen, Building, ClipboardList, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Student = {
  id: string
  name: string
}

type Subject = {
  code: string
  name: string
  className: string
  students: Student[]
}

type Venue = {
  roomNumber: string
  classroomName: string
  rows: number
  columns: number
}

export type Allocation = {
  roomNumber: string
  classroomName: string
  seats: Array<{ subjectCode: string; subjectName: string; className: string; studentId: string; studentName: string } | null>[]
  totalStudents: number
  allocatedSubjects: Set<string>
  allocatedClasses: Set<string>
}

export default function ExamHallAllocation() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [step, setStep] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalCapacity, setTotalCapacity] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [unallocatedStudents, setUnallocatedStudents] = useState<{ subjectCode: string; subjectName: string; className: string; studentId: string; studentName: string }[]>([])

  useEffect(() => {
    const newTotalStudents = subjects.reduce((sum, subject) => sum + subject.students.length, 0)
    setTotalStudents(newTotalStudents)
  }, [subjects])

  useEffect(() => {
    const newTotalCapacity = venues.reduce((sum, venue) => sum + venue.rows * venue.columns, 0)
    setTotalCapacity(newTotalCapacity)
  }, [venues])

  const addSubject = (subject: Subject) => {
    if (editingSubject) {
      setSubjects(subjects.map(s => s.code === editingSubject.code ? subject : s))
      setEditingSubject(null)
    } else {
      setSubjects([...subjects, subject])
    }
  }

  const editSubject = (subject: Subject) => {
    setEditingSubject(subject)
  }

  const deleteSubject = (subjectCode: string) => {
    setSubjects(subjects.filter(s => s.code !== subjectCode))
  }

  const addVenue = (venue: Venue) => {
    if (editingVenue) {
      setVenues(venues.map(v => v.roomNumber === editingVenue.roomNumber ? venue : v))
      setEditingVenue(null)
    } else {
      setVenues([...venues, venue])
    }
  }

  const editVenue = (venue: Venue) => {
    setEditingVenue(venue)
  }

  const deleteVenue = (roomNumber: string) => {
    setVenues(venues.filter(v => v.roomNumber !== roomNumber))
  }

  const allocateSeats = () => {
    if (totalCapacity < totalStudents) {
      setError('Total venue capacity is less than the number of students. Please add more venues.')
      return
    }

    const newAllocations: Allocation[] = []
    const remainingStudents = subjects.flatMap(subject =>
      subject.students.map(student => ({
        subjectCode: subject.code,
        subjectName: subject.name,
        className: subject.className,
        studentId: student.id,
        studentName: student.name
      }))
    )

    venues.forEach(venue => {
      const allocation: Allocation = {
        roomNumber: venue.roomNumber,
        classroomName: venue.classroomName,
        seats: Array(venue.rows).fill(null).map(() => Array(venue.columns).fill(null)),
        totalStudents: 0,
        allocatedSubjects: new Set(),
        allocatedClasses: new Set()
      }

      const isDHRoom = venue.roomNumber.startsWith('DH')

      for (let col = 0; col < venue.columns; col++) {
        for (let row = 0; row < venue.rows; row++) {
          if (remainingStudents.length === 0) break

          let studentIndex = -1
          if (isDHRoom) {
            studentIndex = 0
          } else {
            for (let i = 0; i < remainingStudents.length; i++) {
              const student = remainingStudents[i]
              if (
                (row === 0 || allocation.seats[row - 1][col]?.subjectCode !== student.subjectCode) &&
                (col === 0 || allocation.seats[row][col - 1]?.subjectCode !== student.subjectCode)
              ) {
                studentIndex = i
                break
              }
            }
          }

          if (studentIndex !== -1) {
            const student = remainingStudents[studentIndex]
            allocation.seats[row][col] = student
            allocation.totalStudents++
            allocation.allocatedSubjects.add(student.subjectCode)
            allocation.allocatedClasses.add(student.className)
            remainingStudents.splice(studentIndex, 1)
          }
        }
      }

      newAllocations.push(allocation)
    })

    setAllocations(newAllocations)
    setUnallocatedStudents(remainingStudents)
    setStep(4)
    setError(null)
  }

  const printAllocation = (type: 'classroom' | 'noticeboard') => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Exam Hall Allocation</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 20px; page-break-inside: avoid; }
              th, td { border: 1px solid black; padding: 5px; text-align: center; }
              h1, h2 { text-align: center; }
              .page-break { page-break-after: always; }
              .notice-board { display: flex; flex-wrap: wrap; }
              .notice-board-item { width: 50%; padding: 10px; box-sizing: border-box; }
            </style>
          </head>
          <body>
            <h1>Exam Hall Allocation</h1>
      `)

      if (type === 'classroom') {
        allocations.forEach((allocation, index) => {
          printWindow.document.write(`
            <div ${index > 0 ? 'class="page-break"' : ''}>
              <h2>${allocation.roomNumber} - ${allocation.classroomName}</h2>
              <p>Total Students: ${allocation.totalStudents}</p>
              <p>Subjects: ${Array.from(allocation.allocatedSubjects).join(', ')}</p>
              <p>Classes: ${Array.from(allocation.allocatedClasses).join(', ')}</p>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    ${allocation.seats[0].map((_, colIndex) => `<th>${colIndex + 1}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${allocation.seats.map((row, rowIndex) => `
                    <tr>
                      <th>${rowIndex + 1}</th>
                      ${row.map(seat => `
                        <td>
                          ${seat ? `
                            ${seat.studentId}<br>
                            ${seat.studentName}<br>
                            ${seat.subjectCode}<br>
                            ${seat.className}
                          ` : ''}
                        </td>
                      `).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `)
        })
      } else {
        printWindow.document.write('<table>')
        let currentRow: string[] = []
        allocations.forEach((allocation, index) => {
          const allocationHtml = `
            <td>
              <h2>${allocation.roomNumber} - ${allocation.classroomName}</h2>
              <p>Total Students: ${allocation.totalStudents}</p>
              <ul style="list-style-type: none; padding: 0;">
                ${allocation.seats.flat().filter(Boolean).map(seat => `
                  <li>${seat!.studentId} (${seat!.className})</li>
                `).join('')}
              </ul>
            </td>
          `
          currentRow.push(allocationHtml)

          if (currentRow.length === 2 || index === allocations.length - 1) {
            printWindow.document.write('<tr>')
            printWindow.document.write(currentRow.join(''))
            if (currentRow.length === 1) {
              printWindow.document.write('<td></td>') // Add empty cell if odd number of allocations
            }
            printWindow.document.write('</tr>')
            currentRow = []
          }
        })
        printWindow.document.write('</table>')
      }

      printWindow.document.write(`
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const addExtraClassroom = () => {
    setStep(2)
    setError('Please add an extra classroom to accommodate remaining students.')
  }

  const fillWithoutAdjacency = () => {
    const newAllocations = [...allocations]
    const remainingStudents = [...unallocatedStudents]

    newAllocations.forEach(allocation => {
      for (let col = 0; col < allocation.seats[0].length; col++) {
        for (let row = 0; row < allocation.seats.length; row++) {
          if (!allocation.seats[row][col] && remainingStudents.length > 0) {
            const student = remainingStudents.shift()!
            allocation.seats[row][col] = student
            allocation.totalStudents++
            allocation.allocatedSubjects.add(student.subjectCode)
            allocation.allocatedClasses.add(student.className)
          }
        }
      }
    })

    setAllocations(newAllocations)
    setUnallocatedStudents(remainingStudents)
  }

  const tabData = [
    { id: 1, name: 'Subjects', icon: BookOpen },
    { id: 2, name: 'Venues', icon: Building },
    { id: 3, name: 'Review', icon: ClipboardList },
    { id: 4, name: 'Results', icon: CheckCircle },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <Card className="w-full mx-auto bg-white shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-gray-600 mb-4">
              Note: In rooms starting with DH, adjacent columns can have the same subjects. For other rooms, adjacent columns cannot have the same subjects. Rooms are filled efficiently to minimize space wastage.
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
                <SubjectForm addSubject={addSubject} editingSubject={editingSubject} onEditComplete={() => setEditingSubject(null)} />
                <div className="mt-4">
                  <h2 className="text-xl font-semibold mb-2 text-blue-700">Entered Subjects:</h2>
                  {subjects.length > 0 ? (
                    <ul className="space-y-2">
                      {subjects.map((subject, index) => (
                        <li
                          key={index}
                          className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-100 p-2 rounded-md"
                        >
                          <span className="mb-2 sm:mb-0">
                            {subject.code} - {subject.name} ({subject.className})
                            <br />
                            Students: {subject.students.length}
                          </span>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => editSubject(subject)} className="text-blue-700 hover:text-blue-900">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteSubject(subject.code)} className="text-red-600 hover:text-red-800">
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
                <p className="mt-4 font-semibold text-blue-700">Total students: {totalStudents}</p>
                <Button
                  className="mt-4 bg-blue-700 text-white hover:bg-blue-800 w-full sm:w-auto"
                  onClick={() => setStep(2)}
                  disabled={subjects.length === 0}
                >
                  Proceed to Venues
                </Button>
              </TabsContent>
              <TabsContent value="step-2">
                <VenueForm addVenue={addVenue} editingVenue={editingVenue} onEditComplete={() => setEditingVenue(null)} />
                <div className="mt-4">
                  <h2 className="text-xl font-semibold mb-2 text-blue-700">Entered Venues:</h2>
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
                            <Button variant="ghost" size="sm" onClick={() => editVenue(venue)} className="text-blue-700 hover:text-blue-900">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteVenue(venue.roomNumber)} className="text-red-600 hover:text-red-800">
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
                <p className="mt-4 font-semibold text-blue-700">Total capacity: {totalCapacity}</p>
                <p className="mt-2 font-semibold text-blue-700">Total students: {totalStudents}</p>
                <Button
                  className="mt-4 bg-blue-700 text-white hover:bg-blue-800 w-full sm:w-auto"
                  onClick={() => setStep(3)}
                  disabled={venues.length === 0}
                >
                  Proceed to Review
                </Button>
              </TabsContent>
              <TabsContent value="step-3">
                <h2 className="text-xl font-semibold mb-2 text-blue-700">Review and Allocate</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-700">Subjects:</h3>
                  {subjects.map((subject, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-blue-700">{subject.code} - {subject.name} ({subject.className})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">Number of students: {subject.students.length}</p>
                        <p className="text-sm text-gray-600">Student Data:</p>
                        <ul className="text-sm break-words list-disc pl-5">
                          {subject.students.map((student, idx) => (
                            <li key={idx}>{student.id} - {student.name}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                  <h3 className="text-lg font-semibold mt-6 text-blue-700">Venues:</h3>
                  {venues.map((venue, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-blue-700">{venue.roomNumber} {venue.classroomName && `- ${venue.classroomName}`}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">Rows: {venue.rows}</p>
                        <p className="text-sm text-gray-600">Columns: {venue.columns}</p>
                        <p className="text-sm text-gray-600">Capacity: {venue.rows * venue.columns}</p>
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
                      <h2 className="text-xl font-semibold text-blue-700 mb-2 sm:mb-0">Seat Allocation Results</h2>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full sm:w-auto border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white">
                            <Printer className="mr-2 h-4 w-4" /> Print
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Choose Print Type</DialogTitle>
                            <DialogDescription>
                              Select the type of print you want to generate.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button onClick={() => printAllocation('classroom')}>Classroom Copy</Button>
                            <Button onClick={() => printAllocation('noticeboard')}>Notice Board Copy</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <AllocationDisplay
                      allocations={allocations}
                    />
                    {unallocatedStudents.length > 0 && (
                      <div className="mt-4 space-y-4">
                        <p className="font-semibold text-blue-700">Options for remaining students:</p>
                        <Button onClick={addExtraClassroom} className="w-full sm:w-auto mr-0 sm:mr-4 mb-2 sm:mb-0 bg-blue-700 text-white hover:bg-blue-800">
                          Add Extra Classroom
                        </Button>
                        <Button onClick={fillWithoutAdjacency} variant="secondary" className="w-full sm:w-auto bg-gray-200 text-blue-700 hover:bg-gray-300">
                          Fill Without Checking Adjacency
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Allocations Made</h3>
                    <p className="text-gray-600 mb-4">Please go to the Review tab and allocate seats before viewing results.</p>
                    <Button onClick={() => setStep(3)} className="bg-blue-700 text-white hover:bg-blue-800">
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
  )
}