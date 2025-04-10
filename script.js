$(document).ready(function() {
    // Initialize variables
    let courses = [];
    let editIndex = -1;
    
    // Bootstrap Modal
    const courseModal = new bootstrap.Modal(document.getElementById('courseModal'));
    
    // Load saved data if exists
    if (localStorage.getItem('studyPlan')) {
        courses = JSON.parse(localStorage.getItem('studyPlan'));
        renderCourses();
        updateTotalHours();
    }
    
    // Event: Day checkbox change
    $(document).on('change', '.day-checkbox', function() {
        updateDayTimeSlots();
    });
    
    // Function: Update day time slots based on selected days
    function updateDayTimeSlots() {
        const timeSlotsContainer = $('#days-time-slots');
        timeSlotsContainer.empty();
        
        $('.day-checkbox:checked').each(function() {
            const day = $(this).val();
            const dayId = $(this).attr('id');
            const timeInputId = dayId + '-time';
            
            const timeSlot = `
                <div class="row mb-2 day-time-slot">
                    <div class="col-md-3">
                        <label class="form-label">${day}</label>
                    </div>
                    <div class="col-md-9">
                        <input type="text" class="form-control day-time-input" 
                               id="${timeInputId}" 
                               data-day="${day}" 
                               placeholder="مثال: 08:00 - 10:00">
                    </div>
                </div>
            `;
            
            timeSlotsContainer.append(timeSlot);
        });
    }
    
    // Event: Add new course
    $('#addCourse').click(function() {
        resetForm();
        $('#modalTitle').text('إضافة مقرر جديد');
        courseModal.show();
    });
    
    // Event: Save course (add/edit)
    $('#saveCourse').click(function() {
        // Validate form
        if (!$('#courseForm')[0].checkValidity()) {
            $('#courseForm')[0].reportValidity();
            return;
        }
        
        // Get day-time pairs
        const dayTimeArray = [];
        $('.day-time-slot').each(function() {
            const day = $(this).find('.day-time-input').data('day');
            const time = $(this).find('.day-time-input').val().trim();
            
            if (time) {
                dayTimeArray.push({ day, time });
            }
        });
        
        // Get form data
        const course = {
            name: $('#courseName').val(),
            hours: parseInt($('#creditHours').val()),
            prerequisite: $('#prerequisite').val(),
            dayTimes: dayTimeArray,
            notes: $('#notes').val()
        };
        
        // Add new or update existing
        if (editIndex === -1) {
            courses.push(course);
        } else {
            courses[editIndex] = course;
        }
        
        // Save, render and close modal
        saveToLocalStorage();
        renderCourses();
        updateTotalHours();
        courseModal.hide();
    });
    
    // Event: Print plan
    $('#printPlan').click(function() {
        window.print();
    });
    
    // Event: Save plan
    $('#savePlan').click(function() {
        saveToLocalStorage();
        
        // Show success message
        const alertHtml = `
            <div class="alert alert-success alert-dismissible fade show mt-3" role="alert">
                <i class="fas fa-check-circle me-1"></i> تم حفظ الخطة الدراسية بنجاح!
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        $(alertHtml).insertAfter('.card-header').delay(3000).fadeOut(function() {
            $(this).remove();
        });
    });
    
    // Event: Clear all courses
    $('#clearPlan').click(function() {
        if (courses.length === 0) return;
        
        if (confirm('هل أنت متأكد من حذف جميع المقررات؟')) {
            courses = [];
            saveToLocalStorage();
            renderCourses();
            updateTotalHours();
        }
    });
    
    // Event delegation for edit/delete buttons
    $('#coursesList').on('click', '.edit-course', function() {
        const index = $(this).data('index');
        editIndex = index;
        
        // Reset form
        resetForm();
        
        // Fill form with course data
        $('#courseId').val(index);
        $('#courseName').val(courses[index].name);
        $('#creditHours').val(courses[index].hours);
        $('#prerequisite').val(courses[index].prerequisite);
        $('#notes').val(courses[index].notes || '');
        
        // Check appropriate day checkboxes
        if (courses[index].dayTimes && courses[index].dayTimes.length > 0) {
            courses[index].dayTimes.forEach(dt => {
                // Find and check the checkbox for this day
                $('.day-checkbox').each(function() {
                    if ($(this).val() === dt.day) {
                        $(this).prop('checked', true);
                    }
                });
            });
            
            // Update time slots
            updateDayTimeSlots();
            
            // Fill in time values
            courses[index].dayTimes.forEach(dt => {
                $('.day-time-input').each(function() {
                    if ($(this).data('day') === dt.day) {
                        $(this).val(dt.time);
                    }
                });
            });
        }
        
        // Show modal
        $('#modalTitle').text('تعديل المقرر');
        courseModal.show();
    });
    
    $('#coursesList').on('click', '.delete-course', function() {
        const index = $(this).data('index');
        
        if (confirm('هل أنت متأكد من حذف هذا المقرر؟')) {
            courses.splice(index, 1);
            saveToLocalStorage();
            renderCourses();
            updateTotalHours();
        }
    });
    
    // Function: Reset form
    function resetForm() {
        $('#courseForm')[0].reset();
        $('.day-checkbox').prop('checked', false);
        $('#days-time-slots').empty();
        editIndex = -1;
    }
    
    // Function: Save to localStorage
    function saveToLocalStorage() {
        localStorage.setItem('studyPlan', JSON.stringify(courses));
    }
    
    // Function: Format day-times for display
    function formatDayTimes(dayTimes) {
        if (!dayTimes || dayTimes.length === 0) return '-';
        
        return dayTimes.map(dt => `${dt.day}: ${dt.time}`).join('<br>');
    }
    
    // Function: Render courses
    function renderCourses() {
        const tbody = $('#coursesList');
        tbody.empty();
        
        courses.forEach((course, index) => {
            const row = `
                <tr class="fade-in">
                    <td>${index + 1}</td>
                    <td>${course.name}</td>
                    <td>${course.hours}</td>
                    <td>${course.prerequisite || '-'}</td>
                    <td>${formatDayTimes(course.dayTimes)}</td>
                    <td>${course.notes || '-'}</td>
                    <td class="action-buttons">
                        <button class="btn btn-warning btn-sm edit-course" data-index="${index}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-course" data-index="${index}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
        
        // Show message if no courses
        if (courses.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="7" class="text-center p-4">
                        <i class="fas fa-info-circle me-2"></i> لا توجد مقررات. قم بإضافة مقرر جديد.
                    </td>
                </tr>
            `);
        }
    }
    
    // Function: Update total hours
    function updateTotalHours() {
        const total = courses.reduce((sum, course) => sum + course.hours, 0);
        $('#totalHours').text(total);
    }
});
