package com.cyuzuzo.backend.model;



public record UserUpdateRequest(

    String name,

    String phone,

    String department,

    String region,

    String role,

    String status,

    Boolean mfaEnabled

) {

}

