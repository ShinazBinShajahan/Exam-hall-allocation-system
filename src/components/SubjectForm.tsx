'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as XLSX from 'xlsx'

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

type SubjectFormProps = {
  addSubject: (subject: Subject) => void
  editingSubject: Subject | null
  onEditComplete: () => void
}

export default function SubjectForm({ addSubject, editingSubject, onEditComplete }: SubjectFormProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [className, setClassName] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [newStudentId, setNewStudentId] = useState('')
  const [newStudentName, setNewStudentName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingSubject) {
      setCode(editingSubject.code)
      setName(editingSubject.name)
      setClassName(editingSubject.className)
      setStudents(editingSubject.students)
    } else {
      resetForm()
    }
  }, [editingSubject])

  const resetForm = () => {
    setCode('')
    setName('')
    setClassName('')
    setStudents([])
    setNewStudentId('')
    setNewStudentName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setStudents([]) // Clear previous student data
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['id', 'name'] })
        const newStudents = jsonData.slice(1) as Student[] // Assuming first row is header
        setStudents(newStudents)
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  const handleStudentDataChange = useCallback((studentIndex: number, field: keyof Student, value: string) => {
    setStudents(prevStudents => 
      prevStudents.map((student, index) =>
        index === studentIndex ? { ...student, [field]: value } : student
      )
    )
  }, [])

  const removeStudent = useCallback((studentIndex: number) => {
    setStudents(prevStudents => prevStudents.filter((_, index) => index !== studentIndex))
  }, [])

  const addStudent = useCallback(() => {
    if (newStudentId && newStudentName) {
      setStudents(prevStudents => [...prevStudents, { id: newStudentId, name: newStudentName }])
      setNewStudentId('')
      setNewStudentName('')
    }
  }, [newStudentId, newStudentName])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newSubject: Subject = {
      code,
      name,
      className,
      students
    }
    addSubject(newSubject)
    resetForm()
    if (editingSubject) {
      onEditComplete()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">Subject Code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="name">Subject Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="className">Class Name</Label>
        <Input
          id="className"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          required
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="studentData">Upload Student Data (Excel file)</Label>
              <Input
                id="studentData"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="mt-1"
                ref={fileInputRef}
              />
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Student ID"
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
              />
              <Input
                placeholder="Student Name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
              />
              <Button type="button" onClick={addStudent}>Add Student</Button>
            </div>
            {students.length > 0 && (
              <div>
                <h4 className="text-md font-semibold mb-2">Student Data Preview</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={student.id}
                            onChange={(e) => handleStudentDataChange(index, 'id', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={student.name}
                            onChange={(e) => handleStudentDataChange(index, 'name', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button type="button" onClick={() => removeStudent(index)} variant="destructive" size="sm">
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="mt-2">Total Students: {students.length}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Button type="submit" className="w-full">
        {editingSubject ? 'Update Subject' : 'Add Subject'}
      </Button>
    </form>
  )
}