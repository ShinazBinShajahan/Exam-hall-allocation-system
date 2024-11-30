import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Allocation } from "./ExamHallAllocation";

type AllocationDisplayProps = {
  allocations: Allocation[];
};

export default function AllocationDisplay({
  allocations,
}: AllocationDisplayProps) {
  console.log("Allocations : \n", allocations);
  return (
    <div className="space-y-6">
      {allocations.map((allocation, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>
              {allocation.roomNumber} - {allocation.classroomName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Total Students: {allocation.totalStudents}</p>
            <p>
              Subjects: {Array.from(allocation.allocatedSubjects).join(", ")}
            </p>
            <p>Batches: {Array.from(allocation.allocatedClasses).join(", ")}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  {allocation.seats[0].map((_, colIndex) => (
                    <TableHead key={colIndex}>{colIndex + 1}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocation.seats.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell>{rowIndex + 1}</TableCell>
                    {row.map((seat, seatIndex) => (
                      <TableCell key={seatIndex}>
                        {seat ? (
                          <>
                            <div>{seat.studentId}</div>
                            <div>{seat.studentName}</div>
                            <div>{seat.subjectCode}</div>
                          </>
                        ) : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
