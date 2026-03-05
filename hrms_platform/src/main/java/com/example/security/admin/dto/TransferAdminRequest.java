package com.example.security.admin.dto;

import lombok.Data;

@Data
public class TransferAdminRequest {

    private Long fromAdminEmployeeId;

    private Long toEmployeeId;

}
