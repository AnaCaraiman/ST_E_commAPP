package com.example.ecommerce.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.ecommerce.dto.SupportTicketDTO;
import com.example.ecommerce.service.SupportTicketService;

import java.util.List;

@RestController
@RequestMapping("/support-tickets")
public class SupportTicketController {
    
    @Autowired
    private SupportTicketService supportTicketService;
    
    @GetMapping
    public List<SupportTicketDTO> getAllSupportTickets() {
        return supportTicketService.getAllSupportTickets();
    }
    
    @PostMapping
    public SupportTicketDTO createSupportTicket(@RequestParam String orderId, @RequestParam String complaint) {
        return supportTicketService.createSupportTicket(orderId, complaint);
    }
    
    @DeleteMapping("/{id}")
    public void deleteSupportTicket(@PathVariable String id) {
        supportTicketService.deleteSupportTicket(id);
    }
}

