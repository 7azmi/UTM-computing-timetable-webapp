class SubjectManager {
    constructor() {
        this.baseUrl = "http://web.fc.utm.my/ttms/web_man_webservice_json.cgi";
        this.authAdminUrl = "http://web.fc.utm.my/ttms/auth-admin.php";
    }

    // Function to fetch admin session ID
    async fetchAdminSessionId(userSessionId) {
        const url = `${this.authAdminUrl}?session_id=${userSessionId}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data && data.length > 0 && data[0].session_id) {
                return data[0].session_id;
            } else {
                throw new Error("Admin session ID not found in response");
            }
        } catch (error) {
            console.error("Error fetching admin session ID:", error);
            return null;
        }
    }

    // Fetch all subjects for a given student ID
    async fetchStudentSubjects(studentId) {
        const url = `${this.baseUrl}?entity=pelajar_subjek&no_matrik=${studentId}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching student subjects:", error);
            return [];
        }
    }

    // Fetch all subjects for a given lecturer ID
    async fetchLecturerSubjects(lecturerId) {
        const url = `${this.baseUrl}?entity=pensyarah_subjek&no_pekerja=${lecturerId}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching lecturer subjects:", error);
            return [];
        }
    }

    // Fetch the subjects of the latest semester for students
    async fetchLatestSemesterStudentSubjects(studentId) {
        const subjects = await this.fetchStudentSubjects(studentId);
        
        // Determine the latest session
        const latestSession = subjects.reduce((latest, subject) => {
            return (latest.sesi < subject.sesi) ? subject : latest;
        }, subjects[0]);

        // Filter subjects for the latest semester
        const latestSemesterSubjects = subjects.filter(subject => {
            return subject.sesi === latestSession.sesi && subject.semester === latestSession.semester;
        });

        return latestSemesterSubjects;
    }

    // Fetch the subjects of the latest semester for lecturers
    async fetchLatestSemesterLecturerSubjects(lecturerId) {
        const subjects = await this.fetchLecturerSubjects(lecturerId);
        
        // Determine the latest session
        const latestSession = subjects.reduce((latest, subject) => {
            return (latest.sesi < subject.sesi) ? subject : latest;
        }, subjects[0]);

        // Filter subjects for the latest semester
        const latestSemesterSubjects = subjects.filter(subject => {
            return subject.sesi === latestSession.sesi && subject.semester === latestSession.semester;
        });

        return latestSemesterSubjects;
    }

    // Fetch the timetable for a specific subject
    async fetchSubjectTimetable(kodSubjek, sesi, semester, seksyen) {
        const url = `${this.baseUrl}?entity=jadual_subjek&sesi=${sesi}&semester=${semester}&kod_subjek=${kodSubjek}&seksyen=${seksyen}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching subject timetable:", error);
            return [];
        }
    }

    // Fetch all lecturers
    async fetchAllLecturers(adminSessionId, sesi, semester) {
        const url = `${this.baseUrl}?entity=pensyarah&session_id=${adminSessionId}&sesi=${sesi}&semester=${semester}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching lecturers:", error);
            return [];
        }
    }
    // Fetch all students (with pagination)
    async fetchAllStudents(adminSessionId, sesi, semester) {
        let students = [];
        let offset = 0;
        const limit = 1000;
        let moreData = true;
        const maxIterations = 70; // Maximum number of iterations to prevent infinite loops
        let iterations = 0;

        while (moreData && iterations < maxIterations) {
            const url = `${this.baseUrl}?entity=pelajar&session_id=${adminSessionId}&sesi=${sesi}&semester=${semester}&limit=${limit}&offset=${offset}`;
            console.log(`Fetching students with offset: ${offset}, limit: ${limit}`);
            try {
                const response = await fetch(url);
                const data = await response.json();
                console.log(`Fetched ${data.length} students`);
                
                // Check if the result is empty or just an empty sample result
                if (data.length > 1 || (data.length === 1 && data[0] && Object.keys(data[0]).length > 0)) {
                    students = students.concat(data);
                    offset += limit;
                    iterations++;
                    if (data.length < limit) {
                        moreData = false;
                    }
                } else {
                    moreData = false;
                }
            } catch (error) {
                console.error("Error fetching students:", error);
                moreData = false;
            }
        }

        if (iterations >= maxIterations) {
            console.warn("Reached maximum iterations limit. Stopping further requests.");
        }

        return students;
    }

}
