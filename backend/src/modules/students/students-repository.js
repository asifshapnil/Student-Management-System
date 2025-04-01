const { processDBRequest } = require("../../utils");

const getRoleId = async (roleName) => {
    const query = "SELECT id FROM roles WHERE name ILIKE $1";
    const queryParams = [roleName];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0].id;
}

const findAllStudents = async (payload) => {
    const { name, className, section, roll } = payload;
    console.log("Original payload:", payload);
    
    let processedClassName = className;
    if (className && !className.toLowerCase().startsWith('class')) {
        processedClassName = `Class ${className}`;
    }
    
    console.log("Processed className:", processedClassName);
    
    let query = `
        SELECT
            t1.id,
            t1.name,
            t1.email,
            t1.last_login AS "lastLogin",
            t1.is_active AS "systemAccess",
            t3.class_name AS "className",
            t3.section_name AS "section",
            t3.roll
        FROM users t1
        LEFT JOIN user_profiles t3 ON t1.id = t3.user_id
        WHERE t1.role_id = 3`;
    let queryParams = [];
    if (name) {
        query += ` AND t1.name ILIKE $${queryParams.length + 1}`;
        queryParams.push(`%${name}%`);
    }
    if (processedClassName) {
        query += ` AND t3.class_name = $${queryParams.length + 1}`;
        queryParams.push(processedClassName);
    }
    if (section) {
        query += ` AND t3.section_name = $${queryParams.length + 1}`;
        queryParams.push(section);
    }
    if (roll) {
        query += ` AND t3.roll = $${queryParams.length + 1}`;
        queryParams.push(roll);
    }

    query += ' ORDER BY t1.id';
    
    console.log("SQL Query:", query);
    console.log("Query Parameters:", queryParams);

    const { rows } = await processDBRequest({ query, queryParams });
    console.log("Query Results:", rows.length, "students found");
    return rows;
}

const addOrUpdateStudent = async (payload) => {    
    const isUpdate = !!payload.id;
    
    if (isUpdate) {
        try {
            const userUpdateQuery = `
                UPDATE users
                SET 
                    name = $1, 
                    email = $2, 
                    is_active = $3,
                    updated_dt = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING id
            `;
            const userQueryParams = [
                payload.name, 
                payload.email, 
                payload.systemAccess, 
                payload.id
            ];
            
            console.log("User update query params:", userQueryParams);
            
            const userResult = await processDBRequest({ 
                query: userUpdateQuery, 
                queryParams: userQueryParams 
            });
            
            if (userResult.rowCount === 0) {
                return { status: false, message: `No user found with ID ${payload.id}` };
            }
            
            // Then update the user_profiles table
            const profileUpdateQuery = `
                UPDATE user_profiles
                SET 
                    gender = $1,
                    phone = $2,
                    dob = $3,
                    class_name = $4,
                    section_name = $5,
                    roll = $6,
                    father_name = $7,
                    father_phone = $8,
                    mother_name = $9,
                    mother_phone = $10,
                    guardian_name = $11,
                    guardian_phone = $12,
                    relation_of_guardian = $13,
                    current_address = $14,
                    permanent_address = $15,
                    admission_dt = $16
                WHERE user_id = $17
            `;
            
            const profileQueryParams = [
                payload.gender,
                payload.phone,
                payload.dob,
                payload.class,
                payload.section,
                payload.roll,
                payload.fatherName,
                payload.fatherPhone,
                payload.motherName,
                payload.motherPhone,
                payload.guardianName,
                payload.guardianPhone,
                payload.relationOfGuardian,
                payload.currentAddress,
                payload.permanentAddress,
                payload.admissionDate,
                payload.id
            ];
            
            console.log("Profile update query params:", profileQueryParams);
            
            await processDBRequest({ 
                query: profileUpdateQuery, 
                queryParams: profileQueryParams 
            });
            
            return { status: true, message: "Student updated successfully", userId: payload.id };
        } catch (error) {
            console.error("Error in update operation:", error);
            return { status: false, message: error.message };
        }
    } else {
        // For new student
        try {
            const query = "SELECT * FROM student_add_update($1)";
            const queryParams = [payload];
            const { rows } = await processDBRequest({ query, queryParams });
            return rows[0];
        } catch (error) {
            console.error("Error in add operation:", error);
            return { status: false, message: error.message };
        }
    }
}

const findStudentDetail = async (id) => {
    const query = `
        SELECT
            u.id,
            u.name,
            u.email,
            u.is_active AS "systemAccess",
            p.phone,
            p.gender,
            p.dob,
            p.class_name AS "class",
            p.section_name AS "section",
            p.roll,
            p.father_name AS "fatherName",
            p.father_phone AS "fatherPhone",
            p.mother_name AS "motherName",
            p.mother_phone AS "motherPhone",
            p.guardian_name AS "guardianName",
            p.guardian_phone AS "guardianPhone",
            p.relation_of_guardian as "relationOfGuardian",
            p.current_address AS "currentAddress",
            p.permanent_address AS "permanentAddress",
            p.admission_dt AS "admissionDate",
            r.name as "reporterName"
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN users r ON u.reporter_id = r.id
        WHERE u.id = $1`;
    const queryParams = [id];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
}

const findStudentToSetStatus = async ({ userId, reviewerId, status }) => {
    const now = new Date();
    const query = `
        UPDATE users
        SET
            is_active = $1,
            status_last_reviewed_dt = $2,
            status_last_reviewer_id = $3
        WHERE id = $4
    `;
    const queryParams = [status, now, reviewerId, userId];
    const { rowCount } = await processDBRequest({ query, queryParams });
    return rowCount
}


module.exports = {
    getRoleId,
    findAllStudents,
    addOrUpdateStudent,
    findStudentDetail,
    findStudentToSetStatus,
};
