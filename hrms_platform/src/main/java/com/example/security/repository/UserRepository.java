package com.example.security.repository;

import com.example.security.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByUsername(String username);

    Optional<User> findByResetToken(String resetToken);

    void deleteByEmployeeId(Long employeeId);

    @Query("""
            select distinct u
            from User u
            join u.roles r
            where r.name like 'ROLE_HR%' or r.name = 'ROLE_TALENT_ACQUISITION'
            """)
    List<User> findAllWithHrRole();

    @Query("""
       select count(u)
       from User u
       join u.roles r
       where r.name = :roleName
       and u.enabled = true
       """)
    long countActiveUsersByRole(String roleName);

}



