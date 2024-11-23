import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

export type Allocation = {
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

type AllocationDisplayProps = {
  allocations: Allocation[];
  downloadVenuePDF: (allocation: Allocation) => void;
  printAllocation: (allocation: Allocation) => void;
};

export default function AllocationDisplay({
  allocations,
  downloadVenuePDF,
  printAllocation,
}: AllocationDisplayProps) {
  return (
    <div className="space-y-8">
      {allocations.map((allocation, index) => {
        const isDHRoom = allocation.roomNumber.startsWith("DH");
        return (
          <Card
            key={index}
            className={`overflow-hidden ${
              isDHRoom ? "bg-blue-50" : "bg-white"
            }`}
          >
            <CardHeader
              className={`${
                isDHRoom ? "bg-blue-100" : "bg-gray-100"
              } flex flex-col sm:flex-row justify-between items-start sm:items-center`}
            >
              <CardTitle className="text-lg text-blue-700 mb-2 sm:mb-0">
                Room {allocation.roomNumber}
                {allocation.classroomName && ` - ${allocation.classroomName}`}
                {isDHRoom && (
                  <span className="block sm:inline ml-0 sm:ml-2 text-sm font-normal text-blue-600">
                    (Adjacent columns can have the same subjects)
                  </span>
                )}
              </CardTitle>
              <div className="space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  onClick={() => downloadVenuePDF(allocation)}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
                >
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
                <Button
                  onClick={() => printAllocation(allocation)}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
                >
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mb-4 text-gray-700">
                <p>
                  <strong className="text-blue-700">Allocated Subjects:</strong>{" "}
                  {Array.from(allocation.allocatedSubjects).join(", ")}
                </p>
                <p>
                  <strong className="text-blue-700">Allocated Batches:</strong>{" "}
                  {Array.from(allocation.allocatedBatches).join(", ")}
                </p>
                <p>
                  <strong className="text-blue-700">
                    Total Students Allocated:
                  </strong>{" "}
                  {allocation.totalStudents}
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-center w-16 h-16 text-blue-700"></TableHead>
                      {allocation.seats[0].map((_, colIndex) => (
                        <TableHead
                          key={colIndex}
                          className="font-semibold text-center w-16 h-16 text-blue-700"
                        >
                          {colIndex + 1}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocation.seats.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell className="font-semibold text-center w-16 h-16 text-blue-700">
                          {rowIndex + 1}
                        </TableCell>
                        {row.map((seat, seatIndex) => (
                          <TableCell key={seatIndex} className="p-2 w-16 h-16">
                            {seat ? (
                              <div className="text-center">
                                <div className="text-sm font-semibold text-blue-700">
                                  ID: {seat.studentId}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {seat.subjectCode}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {seat.batchName}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-400">-</div>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
