package com.cyuzuzo.backend.controller;

import jakarta.validation.ConstraintViolationException;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
        String message = exception.getMessage() == null || exception.getMessage().isBlank()
            ? "Bad request"
            : exception.getMessage();
        return ResponseEntity.badRequest().body(new ApiErrorResponse(message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getDefaultMessage() == null ? "Invalid request" : error.getDefaultMessage())
            .collect(Collectors.joining(", "));

        return ResponseEntity.badRequest().body(new ApiErrorResponse(message.isBlank() ? "Invalid request" : message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException exception) {
        return ResponseEntity.badRequest().body(new ApiErrorResponse("Invalid request"));
    }
}
