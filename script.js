document.addEventListener('DOMContentLoaded', () => {
    // Selecciona todos los elementos de los ramos
    const courses = document.querySelectorAll('.course');
    // Selecciona el elemento donde se mostrarán los mensajes de error
    const errorMessageDiv = document.getElementById('errorMessage');

    // Carga los estados de los ramos aprobados desde el almacenamiento local
    loadApprovedCourses();

    // Añade un event listener a cada ramo para manejar el clic
    courses.forEach(course => {
        course.addEventListener('click', () => {
            const courseCode = course.dataset.code; // Obtiene el código del ramo
            const courseName = course.dataset.name; // Obtiene el nombre del ramo

            // Si el ramo ya está aprobado, no hacemos nada o permitimos desaprobar
            if (course.classList.contains('approved')) {
                // Opcional: Si quieres permitir desaprobar ramos haciendo clic de nuevo
                toggleCourseApproval(courseCode, course);
            } else {
                // Intenta aprobar el ramo
                tryApproveCourse(courseCode, courseName, course);
            }
        });
    });

    /**
     * Intenta marcar un ramo como aprobado, verificando sus prerrequisitos.
     * @param {string} courseCode - El código del ramo a intentar aprobar.
     * @param {string} courseName - El nombre del ramo.
     * @param {HTMLElement} courseElement - El elemento HTML del ramo.
     */
    function tryApproveCourse(courseCode, courseName, courseElement) {
        const prerequisites = courseElement.dataset.prerequisites ?
                              courseElement.dataset.prerequisites.split(' ') : [];

        // Verifica si todos los prerrequisitos están cumplidos
        const missingPrerequisites = prerequisites.filter(reqCode => {
            const reqElement = document.querySelector(`.course[data-code="${reqCode}"]`);
            return reqElement && !reqElement.classList.contains('approved');
        });

        // Si hay prerrequisitos faltantes, muestra un mensaje de error
        if (missingPrerequisites.length > 0) {
            const missingNames = missingPrerequisites.map(reqCode => {
                const reqElement = document.querySelector(`.course[data-code="${reqCode}"]`);
                return reqElement ? reqElement.dataset.name : reqCode;
            });
            showErrorMessage(`No puedes aprobar "${courseName}" porque te faltan los siguientes ramos: ${missingNames.join(', ')}.`);
            // Añade la clase 'blocked' para indicar visualmente que está bloqueado
            courseElement.classList.add('blocked');
            setTimeout(() => {
                courseElement.classList.remove('blocked'); // Quita la clase después de un tiempo
            }, 1000); // Duración del efecto de bloqueo
        } else {
            // Si no hay prerrequisitos faltantes, aprueba el ramo
            toggleCourseApproval(courseCode, courseElement);
            hideErrorMessage(); // Oculta cualquier mensaje de error anterior
        }
    }

    /**
     * Alterna el estado de aprobación de un ramo y lo guarda en localStorage.
     * @param {string} courseCode - El código del ramo.
     * @param {HTMLElement} courseElement - El elemento HTML del ramo.
     */
    function toggleCourseApproval(courseCode, courseElement) {
        courseElement.classList.toggle('approved'); // Alterna la clase 'approved'
        updateApprovedCoursesInStorage(courseCode, courseElement.classList.contains('approved'));
        updateAllCoursesBlockedState(); // Revisa el estado de bloqueo de todos los ramos
    }

    /**
     * Actualiza el estado de aprobación de un ramo en el almacenamiento local.
     * @param {string} courseCode - El código del ramo.
     * @param {boolean} isApproved - True si el ramo está aprobado, false en caso contrario.
     */
    function updateApprovedCoursesInStorage(courseCode, isApproved) {
        let approvedCourses = JSON.parse(localStorage.getItem('approvedCourses')) || [];

        if (isApproved) {
            if (!approvedCourses.includes(courseCode)) {
                approvedCourses.push(courseCode);
            }
        } else {
            approvedCourses = approvedCourses.filter(code => code !== courseCode);
        }
        localStorage.setItem('approvedCourses', JSON.stringify(approvedCourses));
    }

    /**
     * Carga los estados de aprobación desde el almacenamiento local y los aplica a los ramos.
     */
    function loadApprovedCourses() {
        const approvedCourses = JSON.parse(localStorage.getItem('approvedCourses')) || [];
        courses.forEach(course => {
            const courseCode = course.dataset.code;
            if (approvedCourses.includes(courseCode)) {
                course.classList.add('approved');
            } else {
                course.classList.remove('approved');
            }
        });
        updateAllCoursesBlockedState(); // Después de cargar, actualiza los estados de bloqueo
    }

    /**
     * Actualiza el estado 'blocked' para todos los ramos basándose en sus prerrequisitos.
     */
    function updateAllCoursesBlockedState() {
        courses.forEach(course => {
            // Un ramo bloqueado es aquel que no está aprobado y tiene prerrequisitos sin cumplir
            const courseCode = course.dataset.code;
            const prerequisites = course.dataset.prerequisites ?
                                  course.dataset.prerequisites.split(' ') : [];

            const isApproved = course.classList.contains('approved');
            let isBlocked = false;

            if (!isApproved && prerequisites.length > 0) {
                const missingPrerequisites = prerequisites.filter(reqCode => {
                    const reqElement = document.querySelector(`.course[data-code="${reqCode}"]`);
                    return reqElement && !reqElement.classList.contains('approved');
                });
                isBlocked = missingPrerequisites.length > 0;
            }

            if (isBlocked) {
                course.classList.add('blocked');
            } else {
                // Solo remover 'blocked' si no está aprobado. Un ramo aprobado no puede estar bloqueado.
                if (!isApproved) {
                    course.classList.remove('blocked');
                }
            }
        });
    }


    /**
     * Muestra un mensaje de error en la interfaz.
     * @param {string} message - El mensaje a mostrar.
     */
    function showErrorMessage(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.add('show');
        // Oculta el mensaje después de 5 segundos
        setTimeout(() => {
            hideErrorMessage();
        }, 5000);
    }

    /**
     * Oculta el mensaje de error.
     */
    function hideErrorMessage() {
        errorMessageDiv.classList.remove('show');
    }
});
