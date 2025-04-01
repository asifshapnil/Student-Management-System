const asyncHandler = require("express-async-handler");
const { getAllStudents, addNewStudent, getStudentDetail, setStudentStatus, updateStudent } = require("./students-service");

const handleGetAllStudents = asyncHandler(async (req, res) => {    
    const { name, class: className, section, roll } = req.query;
    const filters = { name, className, section, roll };
    
    const students = await getAllStudents(filters);
    
    res.json({ students });
});

const handleAddStudent = asyncHandler(async (req, res) => {
    const studentData = req.body;
    
    const result = await addNewStudent(studentData);
    
    res.status(201).json(result);
});

const handleUpdateStudent = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    
    const studentData = req.body;
    
    console.log("Controller: Update student with ID:", id);
    console.log("Controller: Student data received:", studentData);
    
    const result = await updateStudent(id, studentData);
    
    res.json(result);
});

const handleGetStudentDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const student = await getStudentDetail(id);
    
    res.json(student);
});

const handleStudentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const { status } = req.body;
    
    const reviewerId = req.user.id;
    
    const result = await setStudentStatus({ 
        userId: id, 
        reviewerId, 
        status 
    });
    
    res.json(result);
});

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
};
