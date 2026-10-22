
package com.hr_nexus.ops;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpsRecordRepository extends JpaRepository<OpsRecord, Long> {

    List<OpsRecord> findByCategoryIgnoreCaseOrderByRecordDateDesc(String category);

    List<OpsRecord> findByEmployeeIdOrderByRecordDateDesc(Long employeeId);

    List<OpsRecord> findAllByOrderByRecordDateDesc();
}
