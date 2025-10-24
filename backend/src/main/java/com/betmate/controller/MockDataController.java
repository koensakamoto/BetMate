package com.betmate.controller;

import com.betmate.config.DataInitializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class MockDataController {

    @Autowired
    private DataInitializer dataInitializer;

    @PostMapping("/initialize-mock-data")
    public ResponseEntity<?> initializeMockData() {
        try {
            dataInitializer.run();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Mock data initialization completed successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Failed to initialize mock data: " + e.getMessage()
            ));
        }
    }
}