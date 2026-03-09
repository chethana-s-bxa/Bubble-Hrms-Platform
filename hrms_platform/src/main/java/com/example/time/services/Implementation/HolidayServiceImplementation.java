package com.example.time.services.Implementation;

import com.example.time.entity.Holiday;
import com.example.time.repository.HolidayRepository;
import com.example.time.services.HolidayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HolidayServiceImplementation implements HolidayService {

    @Autowired
    private HolidayRepository holidayRepository;

    @Override
    @CacheEvict(cacheNames = "holidaysByLocation", key = "#holiday.location", allEntries = false)
    public Holiday createHoliday(Holiday holiday) {
        return holidayRepository.save(holiday);
    }

    @Override
    @Cacheable(cacheNames = "holidaysByLocation", key = "#location")
    public List<Holiday> getHolidaysByLocation(String location) {
        return holidayRepository.findByLocation(location);
    }
}
