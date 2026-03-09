package com.example.time.services.Implementation;

import com.example.time.entity.LeaveType;
import com.example.time.repository.LeaveTypeRepository;
import com.example.time.services.LeaveTypeService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaveTypeServiceImplementation implements LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;

    public LeaveTypeServiceImplementation(LeaveTypeRepository leaveTypeRepository) {
        this.leaveTypeRepository = leaveTypeRepository;
    }

    @Override
    @Cacheable(cacheNames = "leaveTypes")
    public List<LeaveType> getAllLeaveTypes() {
        return leaveTypeRepository.findAll();
    }
}

