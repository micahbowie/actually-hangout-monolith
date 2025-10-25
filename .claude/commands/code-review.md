Analyze all the unstaged code changes

Your goal is to be strict and rigorous in your review.
Point out areas that are not up to standard and that need to be improved.
Ask questions to the author to clarify the code and the intent of the code.
Perform a comprehensive code review with the following focus areas:

1. **Code Quality**
    - Clean code principles and best practices
    - Proper error handling and edge cases
    - Code readability and maintainability
    - Ensure we are properly using the latest nestjs and typescript best practices
    - There should be no anys
    - Enfore types over interfaces unless there is a clear reason for the interface

2. **Security**
    - Check for potential security vulnerabilities
    - Validate input sanitization
    - Review authentication/authorization logic

3. **Performance**
    - Identify potential performance bottlenecks
    - Check for memory leaks or resource issues
    - Ensure proper caching and state management
    - Flag any N+1 queries or databasepotential performance issues

4. **Testing**
    - Verify adequate test coverage
    - Review test quality and edge cases
    - Check for missing test scenarios
    - Make sure test ids are unique and added to UI elements

5. **Documentation**
    - Ensure code is properly documented
    - Check API documentation accuracy
    - Ensure any code comments are up to date and accurate
    - Ensure code comments are saying why something is done and not what is done

6.. **Pattern Adherence**
    - Check for adherence to patterns and best practices
    - Check to make sure the implementation is consistent with the codebase

7. **Temporal Adherence**
    - Ensure all temporal workflows and activities are properly defined and implemented
    - Ensure all temporal activites are idempotent and can be retried safely
    - Ensure workflows are broken down into smaller activities and workflows
    - Ensure workflows are properly timed and retried
    - Ensure workflows are properly logged and monitored

8. **Database Performance and Design**
    - Check for potential N+1 queries or database performance issues
    - Ensure we are using the best practices for database design and performance
    - Check for column naming conventions and ensure they are consistent
    - Ensure database relationships are properly defined and enforced

9. **Code Observability**
    - Ensure all code is properly observable and can be monitored and logged
    - Capture errors and exceptions