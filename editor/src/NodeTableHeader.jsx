//        NodeTableHeader.jsx  Renders the header of a
//        NodeTable component and triggers a sort when
//        a sortable header element is clicked.
//
//        Copyright (c) 2026, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Dave Hanks, Jet Propulsion Laboratory         
//                                                               

import { useState } from "react";
import {FaSort, FaSortUp, FaSortDown} from 'react-icons/fa'

//
// columns - data comes from parent
// handleSorting - sorting algorithm defined in parent

const NodeTableHeader = ({ columns, handleSorting }) => {
  const [sortField, setSortField] = useState("");
  const [order, setOrder] = useState("asc");

  // Called when user clicks on a sortable column header
  const handleSortingChange = (accessor) => {
    const sortOrder =
      accessor === sortField && order === "asc" ? "desc" : "asc";
    setSortField(accessor);
    setOrder(sortOrder);
    handleSorting(accessor, sortOrder);
  };

  return (
    <thead>
      <tr>
        {columns.map(({ label, accessor, sortable }) => {
          const icon = sortable
            ? sortField === accessor && order === "asc"
              ? <FaSortUp />
              : sortField === accessor && order === "desc"
              ? <FaSortDown />
              : <FaSort />
            : "";
          return (
            <th
              key={accessor}
              onClick={sortable ? () => handleSortingChange(accessor) : null}
            >
              {label}
              {icon}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default NodeTableHeader;
