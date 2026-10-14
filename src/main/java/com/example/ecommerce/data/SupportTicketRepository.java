package com.example.ecommerce.data;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupportTicketRepository extends MongoRepository<SupportTicketEntity, String> {
}
