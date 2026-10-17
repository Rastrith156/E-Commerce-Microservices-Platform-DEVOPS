package com.northstar.catalog;
import java.math.BigDecimal;
public record Product(String id,String name,String category,String description,BigDecimal price,String imageUrl,String badge,double rating,int reviewCount){}
