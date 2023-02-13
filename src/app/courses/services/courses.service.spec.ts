import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { CoursesService } from "./courses.service";
import { COURSES, findLessonsForCourse } from "../../../../server/db-data";
import { Course } from "../model/course";
import { HttpErrorResponse } from "@angular/common/http";

describe("CoursesService", () => {
  let coursesService: CoursesService,
    httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CoursesService],
    });

    coursesService = TestBed.inject(CoursesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it("Should retrieve all courses", () => {
    coursesService.findAllCourses().subscribe((courses) => {
      // it should return courses, else throws exception with message "No courses returned"
      expect(courses).toBeTruthy("No courses returned");

      // it should return courses length
      expect(courses.length).toBe(12, "Incorrect number of courses");

      const course = courses.find((course) => course.id === 12);

      // it should have the course title description as 'Angular Testing Course'
      expect(course.titles.description).toBe("Angular Testing Course");
    });

    const req = httpTestingController.expectOne("/api/courses");

    // it should return request method as GET
    expect(req.request.method).toBe("GET");

    req.flush({
      payload: Object.values(COURSES),
    });
  });

  it("Should retrieve course by Id", () => {
    const courseId: number = 12;

    coursesService.findCourseById(courseId).subscribe((course) => {
      expect(course).toBeTruthy(`No course found with Id: ${courseId}`);
    });

    const req = httpTestingController.expectOne(`/api/courses/${courseId}`);
    expect(req.request.method).toEqual("GET");

    req.flush(COURSES[courseId]);
  });

  it("Should save the course data", () => {
    const courseId: number = 12;
    const changes: Partial<Course> = {
      titles: {
        description: "Testing Course",
      },
    };

    coursesService.saveCourse(courseId, changes).subscribe((course) => {
      expect(course.id).toBe(courseId);
    });

    const req = httpTestingController.expectOne(`/api/courses/${courseId}`);

    expect(req.request.method).toBe("PUT");

    expect(req.request.body.titles.description).toEqual(
      changes.titles.description
    );

    req.flush({
      ...COURSES[12],
      ...changes,
    });
  });

  it("Should give an error if save course fails", () => {
    const courseId: number = 12;
    const changes: Partial<Course> = {
      titles: { description: "Testing Course" },
    };

    coursesService.saveCourse(courseId, changes).subscribe(
      () => fail("The save course operation have failed"),
      (error: HttpErrorResponse) => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpTestingController.expectOne(`/api/courses/${courseId}`);
    expect(req.request.method).toBe("PUT");

    req.flush("Save course failed", {
      status: 500,
      statusText: "Internal server error",
    });
  });

  it("Should find a list of lessons", () => {
    const courseId: number = 12;

    coursesService.findLessons(courseId).subscribe((lessons) => {
      expect(lessons).toBeTruthy();
      expect(lessons.length).toBe(3);
    });

    const req = httpTestingController.expectOne(
      (req) => req.url === "/api/lessons"
    );

    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("courseId")).toBe("12");
    expect(req.request.params.get("filter")).toBe("");
    expect(req.request.params.get("sortOrder")).toEqual("asc");
    expect(req.request.params.get("pageNumber")).toEqual("0");
    expect(req.request.params.get("pageSize")).toEqual("3");

    req.flush({
      payload: findLessonsForCourse(12).slice(0, 3),
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });
});
