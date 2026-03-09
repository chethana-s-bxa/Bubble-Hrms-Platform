package com.example.time.services.Implementation;

import com.example.time.entity.Shift;
import com.example.time.repository.ShiftRepository;
import com.example.time.services.ShiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShiftServiceImplementation implements ShiftService {

    @Autowired
    private ShiftRepository shiftRepository;

    @Override
    @CacheEvict(cacheNames = "allShifts", allEntries = true)
    public Shift createShift(Shift shift) {
        return shiftRepository.save(shift);
    }

    @Override
    @Cacheable(cacheNames = "allShifts")
    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }
}
