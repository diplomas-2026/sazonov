package com.github.danbel.sazonovapi.config;

import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.domain.Role;
import com.github.danbel.sazonovapi.domain.Speciality;
import com.github.danbel.sazonovapi.repository.AppUserRepository;
import com.github.danbel.sazonovapi.repository.SpecialityRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    @Bean
    CommandLineRunner seedData(AppUserRepository userRepository,
                               SpecialityRepository specialityRepository,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            if (specialityRepository.count() == 0) {
                specialityRepository.saveAll(List.of(
                    speciality("09.02.07", "Информационные системы и программирование",
                        "Подготовка разработчиков, администраторов и специалистов по цифровым сервисам.", 25, 15, 40),
                    speciality("38.02.01", "Экономика и бухгалтерский учет",
                        "Работа с документами, учетом, аналитикой и финансовой отчетностью.", 20, 10, 30),
                    speciality("40.02.04", "Юриспруденция",
                        "Подготовка специалистов по правовому сопровождению и документации.", 18, 12, 30)
                ));
            }

            createUserIfMissing(userRepository, passwordEncoder, "admin", "Администратор ПГК",
                "admin@pgk.local", "+7 (900) 000-00-01", Role.ADMIN, "admin123");
            createUserIfMissing(userRepository, passwordEncoder, "staff", "Сотрудник приемной комиссии",
                "staff@pgk.local", "+7 (900) 000-00-02", Role.STAFF, "staff123");
        };
    }

    private void createUserIfMissing(AppUserRepository userRepository,
                                     PasswordEncoder passwordEncoder,
                                     String username,
                                     String fullName,
                                     String email,
                                     String phone,
                                     Role role,
                                     String password) {
        if (userRepository.existsByUsername(username)) {
            return;
        }

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);
    }

    private Speciality speciality(String code, String name, String description, int budget, int paid, int plan) {
        Speciality speciality = new Speciality();
        speciality.setCode(code);
        speciality.setName(name);
        speciality.setDescription(description);
        speciality.setBudgetPlaces(budget);
        speciality.setPaidPlaces(paid);
        speciality.setAdmissionPlan(plan);
        return speciality;
    }
}
