package com.example.security.config;

import com.github.benmanes.caffeine.cache.Caffeine;

import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;
@Configuration
public class CacheConfig {

    @Bean
    public Caffeine<Object, Object> caffeineConfig() {
        return Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES) // cache expires after 10 minutes
                .maximumSize(50); // maximum number of cached entries
    }

    @Bean
    public CacheManager cacheManager(Caffeine<Object, Object> caffeine) {

        CaffeineCacheManager manager = new CaffeineCacheManager();

        manager.setCaffeine(caffeine);

        manager.setCacheNames(List.of(
                "employees",
                "time",
                "documents"
        ));

        return manager;
    }
}